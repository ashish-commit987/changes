import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@mui/styles';

import Footer from './components/Footer';
import GenerateURL from '../util/APIUrlProvider';
import properties from '../properties/properties';
import InvokeApi, { SetHandleError } from '../util/apiInvoker';
import { Loading, LoadingContainer } from '../views/utils/Loading';
import { ApplicationListDataParser, DataParserForSidePanel, ClusterListParser, ApplicationDashboardDataParser } from '../util/APIParser';
import { routes, super_admin_portal, super_admin_routes, user_portal } from '../AppRoutes';
import { useLocation, useNavigate } from 'react-router-dom';
import NavigationNew from './components/NavigationNew';
import { ErrorComponent } from '../views/utils/Error';
import { GetAuth, IsSuperUser } from '../util/security';
import { SetGetApplication, SetGetCluster, SetUpdateClusterData, SetUpdateUserData } from '../util/GlobalVars';
import { ErrorBoundary } from '../components/RouteWithLayout/RouteWithLayout';
import SideNavNew from './components/SideNavNew';
import { usePermissionAutoLoader } from '../util/permissionAutoLoader';
import { generateAppsListingPermissionPayload } from '../util/permissionsPayloadGenerators';
import CopilotOlly from '../views/copilotOlly/Index';
import BreadcrumbsNew from './components/BreadCrumbs';


const MainLayout = (props) => {


  const { children } = props;
  const Navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState({
    user_data: {},
    cluster_data: {},
    error: {},
    alert: false
  });
  const [breadCrumbList, setBreadCrumbList] = useState([]);
  const [chatOpen, setChatOpen] = useState(true);

  const useStyles = makeStyles(theme => ({
    root: ({ isAlertActive }) => {
      console.log('def_pp_00p', props);
      return ({
        paddingTop: isAlertActive ?  50 : 0,
        height: '100%',
        paddingLeft: 257,
        [theme.breakpoints.up('sm')]: {
          paddingTop: isAlertActive ? 50 : 0,
        },
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        '@media screen and (max-width: 1440px)': {
          paddingLeft: "257px",
        },
        '@media screen and (min-width: 1440px) and (max-width: 1920px)': {
          paddingLeft: "291px",
        },
      })
    },


    rootpd: ({ isAlertActive }) => {
      return (
        {
          paddingTop: isAlertActive ? 50 : 0,
          height: '100%',
          paddingLeft: 86,
          [theme.breakpoints.up('sm')]: {
            paddingTop: isAlertActive ? 50 : 0
          },
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          '@media screen and (max-width: 1440px)': {
            paddingLeft: "86px",
          },
          '@media screen and (min-width: 1440px) and (max-width: 1920px)': {
            paddingLeft: "97px",
          },
        }
      )
    },
    topBar: {
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: '#fff',
    },
  }));
  const isAlertActive = state.alert
  const classes = useStyles({ isAlertActive });

  const [open, setOpen] = React.useState(false);
  const auth = GetAuth();
  SetGetApplication(getApplicationData);
  SetUpdateUserData(getUserDataForNavigation);
  SetUpdateClusterData(getClusterList);
  SetGetCluster(getCluster);

  useEffect(() => {
    if (IsSuperUser()) {
      getClusterList();
    } else {
      getUserDataForNavigation();
    }
    SetHandleError(addError);
  }, [auth.id]);

  function addError(error_status, error) {
    let error_id = Date.now();
    setTimeout(() => {
      removeError(error_id);
    }, 7000);
    setState(new_state => ({
      ...new_state,
      error: {
        ...new_state.error,
        [error_id]: error,
      }
    }));
  }

  function removeError(error_id) {
    setState(new_state => ({
      ...new_state,
      error: {
        ...new_state.error,
        [error_id]: null,
      }
    }));
  }

  function getClusterList() {
    let requestInfo = {
      endPoint: GenerateURL({}, properties.api.get_all_clusters),
      httpMethod: "GET",
      httpHeaders: { "Content-Type": "application/json" }
    }
    InvokeApi(requestInfo, handleSuccessApiHitForCluster, handleFailedApiHitForCluster);
  }

  function getUserDataForNavigation() {
    let requestInfo = {
      endPoint: GenerateURL({}, properties.api.side_panel_data),
      httpMethod: "GET",
      httpHeaders: { "Content-Type": "application/json" }
    }
    InvokeApi(requestInfo, handleSuccessApiHit, handleFailedApiHit);
    setState(new_state => ({
      ...new_state,
      user_data: {
        ...new_state.user_data,
      }
    }));
  }
  // function getUserDataForNavigation() {
  //   var requestInfo = {
  //     endPoint: GenerateURL({}, properties.api.project_dashboard),
  //     httpMethod: "GET",
  //     httpHeaders: { "Content-Type": "application/json" }
  //   }
  //   InvokeApi(requestInfo, handleSuccessApiHit, handleFailedApiHit);
  //   setState(new_state => ({
  //     ...new_state,
  //     user_data: {
  //       ...new_state.user_data,
  //     }
  //   }));
  // }

  function handleSuccessApiHit(response) {

    setState(new_state => ({
      ...new_state,
      user_data: {
        status: "RECEIVED",
        data: {
          ...DataParserForSidePanel(response)
        }
      }
    }));
  }

  function handleSuccessApiHitForCluster(response) {
    const data = { ...ClusterListParser(response) };
    console.log("===========> handleSuccessApiHitForCluster", response, data);

    setState(new_state => ({
      ...new_state,
      cluster_data: {
        status: "RECEIVED",
        data: {
          ...data
        }
      }
    }));
  }

  function handleFailedApiHit(error) {
    setState(new_state => ({
      ...new_state,
      user_data: {
        status: "FAILED",
        error: error,
      }
    }));
  }

  function handleFailedApiHitForCluster(error) {
    console.log("===========> handleFailedApiHitForCluster", error);
    setState(new_state => ({
      ...new_state,
      cluster_data: {
        status: "FAILED",
        error: error,
      }
    }));
  }

  function getApplicationData(application_id) {
    return state.user_data.data.application[application_id];
  }

  function getCluster(cluster_id) {
    if (cluster_id)
      return state.cluster_data.data ? state.cluster_data.data.cluster[cluster_id] : "NA";
    else
      return "NA"
  }

  const handleDrawerOpen = () => {
    setOpen(true);
  };
  const handleDrawerClose = () => {
    setOpen(false);
  };
  console.log("mainnn", state.error)

  function removeDuplicates(array) {
    let unique = [];
    array.forEach(element => {
      if (!unique.includes(element)) {
        unique.push(element)
      }
    });

    return (<>{unique.map(uni => (uni ? <>
      <br></br>
      <br></br>
      <ErrorComponent error={uni} /> </> : null))}</>
    );
  }

  const onChangeAlert = (value) => {
    setState(new_state => ({
      ...new_state,
      alert: value
    }));
  }

  console.log("npj_00p_mk", state)

  const handleClickDialogOpenOlly = () => {
    setChatOpen(true);
  };

  const handleCloseDialogOlly = () => {
    setChatOpen(false);
  };

  return (
    <>
      {console.log("npj_00p_mk", state)}
      {
        state.cluster_data.status === "RECEIVED" && IsSuperUser() ||
          state.user_data.status === "RECEIVED" && !IsSuperUser() ?

          <div
            className={open ? classes.root : classes.rootpd}>
            {console.log("npj_00p_mk", state)}
            <SideNavNew
              data={IsSuperUser() ?
                state.cluster_data.data :
                state.user_data.data}
              routes={IsSuperUser() ? super_admin_routes : routes}
              handleDrawerClose={handleDrawerClose}
              handleDrawerOpen={handleDrawerOpen}
              mainOptions={IsSuperUser() ? super_admin_portal : user_portal}
              onChangeAlert={onChangeAlert}
              handleClickOpenOllyDialog={handleClickDialogOpenOlly}
              setBreadCrumbList={setBreadCrumbList}
            />
            <div className={classes.topBar}>
              <BreadcrumbsNew
                list={breadCrumbList}
                routes_url={location}
                super_admin_flag={IsSuperUser()}

                handleClickOpenOllyDialog={handleClickDialogOpenOlly}
              />
            </div>


            <main className={classes.content} style={{ height: 'calc(100vh - 50px)', background: '#fff' }} >
              <ErrorBoundary location={location}>
                {children}
              </ErrorBoundary>
              <Footer />
            </main>
            {/* <CopilotOlly open={chatOpen} onClose={handleCloseDialogOlly} /> */}
          </div>
          :
          state.user_data.status == "FAILED" ?
            <Navigate to="/exception" /> :
            <LoadingContainer />
      }
    </>
  );
};

MainLayout.propTypes = {
  ...PropTypes.objectOf(PropTypes.any),
}

export default MainLayout;
