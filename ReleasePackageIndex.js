import { makeStyles } from '@mui/styles';
import Grid from '@mui/material/Grid';
import Popover from '@mui/material/Popover';
import Tooltip from '@mui/material/Tooltip';
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from "react-router-dom";
import properties from '../../../properties/properties';
import GenerateURL, { GenerateEndpointURL } from '../../../util/APIUrlProvider';
import InvokeApi, { PostData } from '../../../util/apiInvoker';
import { useNavigate } from 'react-router-dom';
import AdvanceSearchFilterCombo from '../../../components/genericComponents/AdvanceSearchFilter/AdvanceSearchFilterCombo';
import { formatDateTime } from '../../../util/util';
import Pagination from '../../../components/Pagination';
import GenericSkeleton from '../../../components/genericComponents/Skeletons/GenericSkeleton';
import Delete from '../../../components/genericComponents/Delete';
import { ErrorComponent } from '../../utils/Error';
import PageHeader from '../../../components/PageHeader';
import BlankPage from '../../../components/BlankPage';
import PaginationTwo from '../../../components/PaginationTwo';
import { usePermissions } from '../../../contexts/PermissionContext';
import PageError from '../../../components/genericComponents/Errors/PageError';
import AddOptionDialog from './AddOptionDialog';
import ReleaseNotesPdf from '../add/manualAdd/components/ReleaseNotesPdf';
import { getAppWiseServices } from '../add/releaseTicketAdd/components/ReleaseTickerRPFinalise';
import { usePermissionAutoLoader } from '../../../util/permissionAutoLoader';
import { generateReleasePackagePayload } from '../../../util/permissionsPayloadGenerators';
import useSystemSettings from '../../../hooks/useSystemSettings';
import { Box } from '@mui/material';
import { Input } from '../../../components/genericComponents/Input';
import { useCustomSnackbar } from '../../../contexts/SnackbarContext';

const ReleasePackageIndex = (props) => {
  const classes = useStyles()
  const { showSnackbar } = useCustomSnackbar();

  const [state, setState] = useState({
    loading: true,
    listPresent: false,
    total_page: "",
    curr_page: "",
    data: {
      releasePackageList: [],
    },
    error: null,
    moreAdvFilterList: [],
    advFilters: {
      release_version: [],
    },
    resetCount: 0,
  })
  const [openDialog, setOpenDialog] = useState(false);

  const defaultFilters = ["release_version"]
  const { autoLoadPermissions } = usePermissionAutoLoader();
  const { settings, settingsLoading = true, error, specificSetting, refetch } = useSystemSettings({
    settingKey: "EDIT_RELEASE_PACKAGE",
  })
  const history = useNavigate()
  useEffect(() => {
    if (!settingsLoading) {
      resetAdvFilter();
    }
  }, [settingsLoading])
  useEffect(() => {
    if (state.resetCount > 0) {
      fetchReleasePackages();
    }
  }, [state.resetCount])
  function fetchReleasePackages(data, url) {
    var requestInfo = {
      endPoint: GenerateURL({}, properties.api.release_package_listing),
      httpMethod: "GET",
      httpHeaders: { "Content-Type": "application/json" }
    }
    if (url) {
      requestInfo.endPoint = url;
    }
    InvokeApi(requestInfo, fetchReleasePackagesSuccess, fetchReleasePackagesFailure);
    setState((prevState) => ({
      ...prevState,
      loading: true,
      current: requestInfo.endPoint,
    }))
  }
  function fetchReleasePackagesSuccess(response) {
    console.log("dhsjasjs", response);
    let listPresent = response.results.length <= 0;
    if (Array.isArray(response?.results)) {
      autoLoadPermissions({
        list: response.results,
        generatorFn: generateReleasePackagePayload,
        getArgs: (item) => [item.id],
      });
    }
    setState((prevState) => ({
      ...prevState,
      loading: false,
      listPresent: listPresent,
      count: response.count,
      next: response.next ? properties.api.baseURL + response.next : null,
      previous: response.previous
        ? properties.api.baseURL + response.previous
        : null,
      data: {
        ...prevState.data,
        releasePackageList: response?.results,
      },
      total_page: Number.isInteger(Number(response.count) / 10)
        ? (Number(response.count) / 10).toFixed(0)
        : (Number(response.count) / 10 + 1).toFixed(0) >
          Number(response.count) / 10 + 1
          ? (Number(response.count) / 10 + 1).toFixed(0) - 1
          : (Number(response.count) / 10 + 1).toFixed(0),
      curr_page: 1,
    }))
  }
  function fetchReleasePackagesFailure(error, statusCode) {
    console.log("dhsjasjs", error);
    setState((prevState) => ({
      ...prevState,
      loading: false,
      error: error,
      statusCode: statusCode
    }))
  }

  function fetchNextReleasePackages(data, url) {
    var requestInfo = {
      endPoint: GenerateURL({}, properties.api.release_package_listing),
      httpMethod: "GET",
      httpHeaders: { "Content-Type": "application/json" }
    }
    if (data) {
      requestInfo.endPoint = GenerateSearchURL(data, requestInfo.endPoint);
    }

    if (url) {
      requestInfo.endPoint = url;
    }
    InvokeApi(requestInfo, fetchNextReleasePackagesSuccess, fetchReleasePackagesFailure);
    setState((prevState) => ({
      ...prevState,
      loading: true,
      current: requestInfo.endPoint,
    }))
  }

  function fetchNextReleasePackagesSuccess(response) {
    console.log("dhsjasjs", response);
    let listPresent = response.results.length <= 0;
    if (Array.isArray(response?.results)) {
      autoLoadPermissions({
        list: response.results,
        generatorFn: generateReleasePackagePayload,
        getArgs: (item) => [item.id],
      });
    }
    setState((prevState) => ({
      ...prevState,
      loading: false,
      listPresent: listPresent,
      count: response.count,
      next: response.next ? properties.api.baseURL + response.next : null,
      previous: response.previous
        ? properties.api.baseURL + response.previous
        : null,
      data: {
        ...prevState.data,
        releasePackageList: response?.results,
      },
      total_page: Number.isInteger(Number(response.count) / 10)
        ? (Number(response.count) / 10).toFixed(0)
        : (Number(response.count) / 10 + 1).toFixed(0) >
          Number(response.count) / 10 + 1
          ? (Number(response.count) / 10 + 1).toFixed(0) - 1
          : (Number(response.count) / 10 + 1).toFixed(0),
      curr_page: Number(prevState.curr_page + 1),
    }))
  }

  function fetchPrevReleasePackages(data, url) {
    var requestInfo = {
      endPoint: GenerateURL({}, properties.api.release_package_listing),
      httpMethod: "GET",
      httpHeaders: { "Content-Type": "application/json" }
    }
    if (data) {
      requestInfo.endPoint = GenerateSearchURL(data, requestInfo.endPoint);
    }

    if (url) {
      requestInfo.endPoint = url;
    }
    InvokeApi(requestInfo, fetchPrevReleasePackagesSuccess, fetchReleasePackagesFailure);
    setState((prevState) => ({
      ...prevState,
      loading: true,
      current: requestInfo.endPoint,
    }))
  }
  function fetchPrevReleasePackagesSuccess(response) {
    console.log("dhsjasjs", response);
    let listPresent = response.results.length <= 0;
    if (Array.isArray(response?.results)) {
      autoLoadPermissions({
        list: response.results,
        generatorFn: generateReleasePackagePayload,
        getArgs: (item) => [item.id],
      });
    }
    setState((prevState) => ({
      ...prevState,
      loading: false,
      listPresent: listPresent,
      count: response.count,
      next: response.next ? properties.api.baseURL + response.next : null,
      previous: response.previous
        ? properties.api.baseURL + response.previous
        : null,
      data: {
        ...prevState.data,
        releasePackageList: response?.results,
      },
      total_page: Number.isInteger(Number(response.count) / 10)
        ? (Number(response.count) / 10).toFixed(0)
        : (Number(response.count) / 10 + 1).toFixed(0) >
          Number(response.count) / 10 + 1
          ? (Number(response.count) / 10 + 1).toFixed(0) - 1
          : (Number(response.count) / 10 + 1).toFixed(0),
      curr_page: Number(prevState.curr_page - 1),
    }))
  }

  function fetchPageReleasePackages(enteredPageNumber) {
    var requestInfo = {
      endPoint: GenerateURL({}, properties.api.release_package_listing),
      httpMethod: "GET",
      httpHeaders: { "Content-Type": "application/json" }
    }

    if (enteredPageNumber > 1) {
      requestInfo.endPoint =
        requestInfo.endPoint +
        "?limit=10&offset=" +
        (enteredPageNumber - 1) * 10;
    }

    var current_page = enteredPageNumber;

    InvokeApi(requestInfo, (response) => { fetchPageReleasePackagesSuccess(response, current_page) }, fetchReleasePackagesFailure);
    setState((prevState) => ({
      ...prevState,
      loading: true,
      current: requestInfo.endPoint,
    }))
  }

  function fetchPageReleasePackagesSuccess(response, count) {
    console.log("dhsjasjs", response);
    let listPresent = response.results.length <= 0;
    if (Array.isArray(response?.results)) {
      autoLoadPermissions({
        list: response.results,
        generatorFn: generateReleasePackagePayload,
        getArgs: (item) => [item.id],
      });
    }
    setState((prevState) => ({
      ...prevState,
      loading: false,
      listPresent: listPresent,
      count: response.count,
      next: response.next ? properties.api.baseURL + response.next : null,
      previous: response.previous
        ? properties.api.baseURL + response.previous
        : null,
      data: {
        ...prevState.data,
        releasePackageList: response?.results,
      },
      total_page: Number.isInteger(Number(response.count) / 10)
        ? (Number(response.count) / 10).toFixed(0)
        : (Number(response.count) / 10 + 1).toFixed(0) >
          Number(response.count) / 10 + 1
          ? (Number(response.count) / 10 + 1).toFixed(0) - 1
          : (Number(response.count) / 10 + 1).toFixed(0),
      curr_page: Number(count),
    }))
  }

  const addFiltersToUrl = (filterName, filterValue) => {
    console.log("thsjks", filterName, filterValue);
    let urlSearchParams = new URLSearchParams(location.search);
    const allFilters = [
      "env_master",
      "project_name",
      "job_type",
      "user_id",
      "status",
      "worker_name",
    ]

    if (filterName == 'all_delete') {
      urlSearchParams = ''
    } else {
      if (filterName == 'adv_search') {
        allFilters.forEach(value => {
          if (!filterValue.includes(value)) {
            urlSearchParams.delete(value)
          }
        })
      }

      if (filterValue?.length == 0) {
        urlSearchParams.delete(filterName)
      }
      else {
        if (urlSearchParams.has(filterName)) {
          urlSearchParams.set(filterName, filterValue.join(','));
        } else {
          urlSearchParams.append(filterName, filterValue.join(','));
        }
      }
    }


    history({ pathname: location.pathname, search: urlSearchParams.toString() });
  }
  const resetFilterData = {
    release_version: [],
  }
  const moreFilterData = [
    { label: "Release", value: "release_version" },
  ]
  const onUpdateHandle = (uniqueId, updatedList) => {

    let updatedKey = ''
    if (uniqueId === 'more-button-adv-0') {
      addFiltersToUrl('adv_search', updatedList)
      if (updatedList?.length == 0) {
        resetAdvFilter()
      }
      else {

        setState(prevState => ({
          ...prevState,
          moreAdvFilterList: updatedList,
        }))
      }
    }
    else {
      if (uniqueId == 'release_adv_1') {
        updatedKey = 'release_version'

      }

      setState(prevState => ({
        ...prevState,
        advFilters: {
          ...prevState.advFilters,
          [updatedKey]: updatedList
        }
      }))
      addFiltersToUrl(updatedKey, updatedList)
      const advFilters = state.advFilters
      advFilters[updatedKey] = updatedList
      fetchReleasePackageForListFilter(advFilters)
    }
  }
  const resetAdvFilter = () => {

    //fetchReposForListFilter(resetFilterData)
    addFiltersToUrl('all_delete')
    setState(prevState => ({
      ...prevState,
      moreAdvFilterList: defaultFilters,
      advFilters: resetFilterData,
      resetCount: prevState.resetCount + 1
    }))

    // will call here normal function
  }
  const staticData = [{
    release_version: "3.2.5.2.1",
    selected_package_type: 'global_package',
    dev: {
      success_services: 6,
      failed_services: 0,
      total_services: 6,
      pipeline_execution: true,
      time: "Apr 17, 2024 12:23 PM",
    },
    qa: {
      success_services: 3,
      failed_services: 3,
      total_services: 6,
      pipeline_execution: true,
      time: "Apr 17, 2024 12:23 PM",
    },
    uat: {
      success_services: 0,
      failed_services: 6,
      total_services: 6,
      pipeline_execution: true,
      time: "Apr 17, 2024 12:23 PM",
    },
    staging: {
      success_services: 3,
      failed_services: 0,
      total_services: 6,
      pipeline_execution: true,
      time: "Apr 17, 2024 12:23 PM",
    },
    prod: {
      success_services: 0,
      failed_services: 0,
      total_services: 6,
      pipeline_execution: false,
      time: "Apr 17, 2024 12:23 PM",
    }
  },

  ]
  function getStatusIcon(status) {
    let normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case "deployed":
        return (
          <div className={classes.icon} style={{ backgroundColor: "#2EBE79" }}>
            <span className='ri-check-fill font-24' style={{ lineHeight: "1" }}></span>
          </div>);
      case "running":
        return (
          <div className={classes.icon} style={{ backgroundColor: "#0086FF" }}>
            <span className='ri-loader-fill font-24' style={{ lineHeight: "1" }}></span>
          </div>);
      case "failed":
        return (
          <div className={classes.icon} style={{ backgroundColor: "#E53737" }}>
            <span className='ri-close-fill font-24' style={{ lineHeight: "1" }}></span>
          </div>);
      case "semi-success":
        return (
          <div className={classes.icon} style={{ backgroundColor: "#E1941D" }}>
            <span className='ri-check-fill font-24' style={{ lineHeight: "1" }}></span>
          </div>
        );
      default:
        return (
          <div className={classes.icon} style={{ backgroundColor: "#bfbfbf" }}>
            <span className='ri-time-line font-24' style={{ lineHeight: "1" }}></span>
          </div>);
    }
  }

  function getStatus(envInfo) {
    const statusObj = {};

    const setStatus = (icon, status, message, time) => {
      statusObj.icon = getStatusIcon(icon);
      statusObj.status = status;
      statusObj.message = message;
      statusObj.time = time;
    };

    if (!envInfo.pipeline_execution) {
      setStatus("not-deployed", "not-deployed", "Not Deployed Yet", null);
      return statusObj;
    }

    const { success_services, failed_services, total_services, time } = envInfo;

    if (success_services === 0 && failed_services === total_services) {
      setStatus("failed", "failed", "All Services Failed", time);
    } else if (failed_services === 0 && success_services === total_services) {
      setStatus("deployed", "deployed", "All Services Passed", time);
    } else if (failed_services === 0 && success_services < total_services) {
      setStatus("running", "running", "In Process", time);
    } else {
      setStatus("semi-success", "semi-success", `${success_services}/${total_services} Services Passed`, time);
    }

    return statusObj;
  }
  console.log("jdjdshhf", state);

  const filterDataPraseReleasePackage = (data) => {

    const updatedList = data?.map(item => {
      return { 'label': item.release_version, 'value': item.release_version, ...item }
    })

    return updatedList
  }

  let advanceFilterJson = {
    'release_version': {
      staticList: false,
      labelName: 'Release Version',
      uniqueId: 'release_adv_1',
      searchVariable: 'release_version',
      getFetchUrl: properties.api.release_package_listing + "?sort=true",
      filterDataPraseFunction: filterDataPraseReleasePackage,
    },
  };

  function fetchReleasePackageForListFilter(listFilterData, activeFilterList) {

    let baseURL = GenerateURL({}, properties.api.release_package_listing)

    const resultURL = generateFilterContainURL(baseURL, listFilterData, activeFilterList);
    console.log("jdnjsnjd", resultURL, baseURL, listFilterData, activeFilterList);
    let requestInfo = {
      endPoint: resultURL,
      httpMethod: "GET",
      httpHeaders: { "Content-Type": "application/json" },
    };
    console.log(requestInfo, 'reft-ppsd')
    setState((new_state) => ({
      ...new_state,
      loading: true,
      current: requestInfo.endPoint,
    }));
    InvokeApi(requestInfo, ReleasePackageFetchSuccess, ReleasePackageFailure);
  }

  function ReleasePackageFetchSuccess(response) {
    var result = response.results;

    setState((new_state) => ({
      ...new_state,
      loading: false,
      count: response.count,
      next: response.next ? properties.api.baseURL + response.next : null,
      previous: response.previous
        ? properties.api.baseURL + response.previous
        : null,
      data: {
        ...new_state.data,
        releasePackageList: result,
      },
      total_page:
        response.count != 0
          ? Number.isInteger(Number(response.count) / 10)
            ? (Number(response.count) / 10).toFixed(0)
            : (Number(response.count) / 10 + 1).toFixed(0) >
              Number(response.count) / 10 + 1
              ? (Number(response.count) / 10 + 1).toFixed(0) - 1
              : (Number(response.count) / 10 + 1).toFixed(0)
          : 1,
      curr_page: 1,
    }));
  }

  function ReleasePackageFailure(error) {
    let error_msg = error.detail ? error.detail : JSON.stringify(error);
    setState((new_state) => ({
      ...new_state,
      error: error_msg,
      loading: false,
    }));
  }
  const isFilterActive = (filterKey, list) => {

    const isFound = list?.find(name => filterKey == name)

    return isFound;
  }
  function generateFilterContainURL(baseURL, listDict, activeFilters) {
    var searchParams = ''
    const filtersKeyArray = Object.keys(listDict)
    let i = 0
    let advFilterApplied = false
    const activeFilterList = activeFilters ? activeFilters : state.moreAdvFilterList
    filtersKeyArray.forEach(key => {

      const arrayFilterValues = listDict[key];
      if (arrayFilterValues.length > 0 && isFilterActive(key, activeFilterList)) {
        if (i != 0) {
          searchParams += '&'
        }
        advFilterApplied = true
        var arrayString = arrayFilterValues;
        const stringKey = `${key}=${arrayString}`
        searchParams += stringKey
        i++;
      }
    })

    const finalUrl = baseURL + '?' + searchParams.toString()

    return searchParams != '' ? finalUrl : baseURL
  }

  const handleAddBtnClick = () => {
    console.log("kdlkdlkls", state);
    setOpenDialog(true);
  }

  const handleCloseDialog = () => {
    setOpenDialog(false);
  }

  const handleFreezeRelease = (freezeState, releasePackageId) => {

    setState((prevState) => ({
      ...prevState,
      data: {
        ...prevState.data,
        releasePackageList: prevState.data.releasePackageList.map((pkg) =>
          pkg.id == releasePackageId
            ? { ...pkg, freeze: !freezeState }
            : pkg
        ),
      },
    }));

    let postPayload = {
      freeze: !freezeState
    }

    state.data.releasePackageList
    showSnackbar("info", `${!freezeState ? 'enabling' : 'disabling'} release package freeze`);
    PostData(GenerateURL({ release_package_id: releasePackageId }, properties.api.freeze_release_package),

      postPayload,
      (response) => {
        showSnackbar("success", response.detail || "change updated successfully");
      },
      (error) => {
        setState((prevState) => ({
          ...prevState,
          data: {
            ...prevState.data,
            releasePackageList: prevState.data.releasePackageList.map((pkg) =>
              pkg.id == releasePackageId
                ? { ...pkg, freeze: freezeState }
                : pkg
            ),
          },
        }));
        showSnackbar("error", error.detail || "failed to update release package freeze");

      }, true);
  }

  console.log(state.data.releasePackageList, 'data_here_001_0s0d')
  return (
    <div className={classes.root}>
      {!state.loading && state?.error ?

        <PageError error={state.error} statusCode={state.statusCode} />

        :
        !state.loading && state.data.releasePackageList && state.data?.releasePackageList.length <= 0 ?
          <BlankPage
            text={'No Release package Added yet'}
            pageIcon={<span className="ri-inbox-line font-28 text-anchor-blue"></span>}
            //action="/cluster/add/firstpage"
            btnLabel={"Add Release Package"}
            primaryButton={
              {
                action: handleAddBtnClick,
                text: 'Add Release Package',
                buttonClass: 'btn-primary m-auto'
              }
            }
          />

          :
          <>
            <PageHeader
              heading={"Release Package"}
              subHeading={"Displaying all Release Packages."}
              commonDivMargin={true}
              icon={'ri-inbox-line'}
              secondaryButton={{
                actionType: 'button',
                action: () => fetchReleasePackages(null, state.current),
                icon: <i className="ri-refresh-line" ></i>,
                buttonClass: 'btn-sq-icon-primary d-flex align-center font-weight-400'
              }}
              primaryButton={{
                action: handleAddBtnClick,//'/release-package/add',
                text: 'Add Release Package',
                icon: <i className="ri-add-line"></i>,
                buttonClass: 'btn-primary',
                isPermitted: true
              }}
            />
            <Grid container spacing={4}>
              <Grid item lg={9} style={{ paddingTop: "24px" }}>


                <Grid container style={{ rowGap: "10px" }}>
                  {
                    state.moreAdvFilterList?.map(filterName => {
                      return (
                        <div key={filterName} className="ad-more-search">
                          <AdvanceSearchFilterCombo
                            reset={state.resetCount}
                            selectedCheckBoxes={state.advFilters[filterName]}
                            searchVariable={advanceFilterJson[filterName]['searchVariable']}
                            staticList={advanceFilterJson[filterName]['staticList']}
                            uniqueId={advanceFilterJson[filterName]['uniqueId']}
                            labelName={advanceFilterJson[filterName]['labelName']}
                            searchUrl={advanceFilterJson[filterName]['searchUrl']}
                            onUpdate={onUpdateHandle}
                            getFetchUrl={advanceFilterJson[filterName]['getFetchUrl']}
                            filterDataPraseFunction={advanceFilterJson[filterName]['filterDataPraseFunction']}
                            showMoreNotRequired={advanceFilterJson[filterName]['showMoreNotRequired']}
                            apiHitOnClick={true}
                          />
                        </div>
                      )
                    })
                  }
                  <div className="ad-more-search">
                    <AdvanceSearchFilterCombo
                      selectedCheckBoxes={state.moreAdvFilterList}
                      reset={state.resetCount}
                      staticList={moreFilterData}
                      autoClosedAfterSelection={true}
                      onUpdate={onUpdateHandle}
                      variant='more-button-new'
                      uniqueId='more-button-adv-0' />
                  </div>
                  <div className="middle-line mr-10" style={{ height: "40px", width: "1px", background: "#CACACA" }}></div>

                  <div className="overflow-hidden d-inline-flex align-center justify-center gap-4 cursor-pointer" onClick={resetAdvFilter} role='button' tabIndex={0} onKeyDown={() => { }}>
                    <span className="ri-filter-3-line font-20 blue-text" ></span>
                    <div className="font-12 font-weight-500 text-transform-uppercase word-wrap-break text-align-center blue-text" >Clear Filters</div>
                  </div>
                </Grid>


              </Grid>

            </Grid>

            <div className={classes.tableContainer}>
              <div className='columns-heading'>
                <div>Freeze</div>
                <div>Release</div>
                <div>Development</div>
                <div>Test</div>
                <div>Uat</div>
                <div>Staging</div>
                <div>Production</div>
                <div></div>
              </div>
              <div className='data-body'>
                {state.loading ?
                  Array.from({ length: 10 }).map((_, index) => (
                    <ReleasePackageItemSkeleton />
                  ))
                  :

                  state.data.releasePackageList.map((item) => {
                    let devStatus = getStatus(item.dev);
                    let qaStatus = getStatus(item.qa);
                    let uatStatus = getStatus(item.uat);
                    let stagingStatus = getStatus(item.staging);
                    let prodStatus = getStatus(item.prod);
                    let isEditable = item.prod && prodStatus.status == 'not-deployed';
                    let isRunning = [
                      devStatus,
                      qaStatus,
                      uatStatus,
                      stagingStatus,
                      prodStatus
                    ].some(status => status.status === 'running');
                    let forceEditEnable = specificSetting == "true" ? true : false;
                    let isFromReleaseTicket = (item?.review_release_meta_data && typeof item?.review_release_meta_data === 'object' && !Array.isArray(item?.review_release_meta_data) && Object.keys(item?.review_release_meta_data).length != 0)
                    let isReleasePackageFreezed = item.freeze ?? false;

                    return (

                      <div className='data-tab'>
                        <FreezeSwitch key={item.id}
                          id={item.id}
                          handleFreezeRelease={handleFreezeRelease}
                          isReleasePackageFreezed={isReleasePackageFreezed} />
                        <Link to={`/release-package/${item.id}`}>
                          <div className={`d-flex f-direction-column`} style={{ gap: '2px' }}>
                            <Tooltip title={item?.release_version || "NA"} arrow>
                              <span className='font-14 font-weight-600 color-icon-secondary text-ellipsis'>{item?.release_version || "NA"}</span>
                            </Tooltip>
                            <div className='d-flex align-center' style={item.selected_package_type == 'global_package' ? { color: '#2EBE79', gap: '6px' } : { color: '#407BCA', gap: '6px' }}>
                              <span className={item.selected_package_type == 'global_package' ? 'ri-earth-line font-16' : 'ri-apps-line font-16'} style={{ lineHeight: 'normal' }}></span>
                              <span className='font-12 font-weight-600'>{item.selected_package_type == 'global_package' ? "Global Package" : "App Package"}</span>
                            </div>
                          </div>
                        </Link>
                        <div>
                          <div className='d-flex align-center' style={{ gap: "10px" }}>
                            {item?.dev ?
                              <>
                                <span>
                                  {devStatus.icon}
                                </span>
                                <div className='d-flex f-direction-column' style={{ gap: "2px" }}>
                                  <span className='font-12 font-weight-600 color-value' style={{ lineHeight: "17px" }}>{devStatus.message || "NA"}</span>
                                  <span className='font-12 font-weight-500 color-icon-secondary' style={{ lineHeight: "14px" }}>{formatDateTime(devStatus.time) || "NA"}</span>
                                </div>
                              </>
                              : null}
                          </div>
                        </div>
                        <div className='d-flex align-center' style={{ gap: "10px" }}>
                          {item?.qa ?
                            <>
                              <span>
                                {qaStatus.icon}
                              </span>
                              <div className='d-flex f-direction-column' style={{ gap: "2px" }}>
                                <span className='font-12 font-weight-600 color-value' style={{ lineHeight: "17px" }}>{qaStatus.message || "NA"}</span>
                                <span className='font-12 font-weight-500 color-icon-secondary' style={{ lineHeight: "14px" }}>{formatDateTime(qaStatus.time) || "NA"}</span>
                              </div>
                            </>
                            : null}
                        </div>
                        <div className='d-flex align-center' style={{ gap: "10px" }}>
                          {item?.uat ?
                            <>
                              <span>
                                {uatStatus.icon}
                              </span>
                              <div className='d-flex f-direction-column' style={{ gap: "2px" }}>
                                <span className='font-12 font-weight-600 color-value' style={{ lineHeight: "17px" }}>{uatStatus.message || "NA"}</span>
                                <span className='font-12 font-weight-500 color-icon-secondary' style={{ lineHeight: "14px" }}>{formatDateTime(uatStatus.time) || "NA"}</span>
                              </div>
                            </>
                            : null}
                        </div>
                        <div className='d-flex align-center' style={{ gap: "10px" }}>
                          {item?.staging ?
                            <>
                              <span>
                                {stagingStatus.icon}
                              </span>
                              <div className='d-flex f-direction-column' style={{ gap: "2px" }}>
                                <span className='font-12 font-weight-600 color-value' style={{ lineHeight: "17px" }}>{stagingStatus.message || "NA"}</span>
                                <span className='font-12 font-weight-500 color-icon-secondary' style={{ lineHeight: "14px" }}>{formatDateTime(stagingStatus.time) || "NA"}</span>
                              </div>
                            </>
                            : null}
                        </div>
                        <div className='d-flex align-center' style={{ gap: "10px" }}>
                          {item?.prod ?
                            <>
                              <span>
                                {prodStatus.icon}
                              </span>
                              <div className='d-flex f-direction-column' style={{ gap: "2px" }}>
                                <span className='font-12 font-weight-600 color-value' style={{ lineHeight: "17px" }}>{prodStatus.message || "NA"}</span>
                                <span className='font-12 font-weight-500 color-icon-secondary' style={{ lineHeight: "14px" }}>{formatDateTime(prodStatus.time) || "NA"}</span>
                              </div>
                            </>
                            : null}
                        </div>
                        <div>
                          <PopoverDropdown
                            name={item?.release_version || "Release Package"}
                            id={item.id}
                            isReleasePackageFreezed={isReleasePackageFreezed}
                            freeze_window_data={{
                              freeze_window_name: item.freeze_window_name,
                              is_edit_frozen: item.is_edit_frozen
                            }}
                            isRunning={isRunning}
                            isEditable={isEditable}
                            forceEditEnable={forceEditEnable}
                            handleRefresh={() => {
                              fetchReleasePackages(null, state.current)
                            }}
                            isFromReleaseTicket={isFromReleaseTicket}
                            totalData={item}
                          />
                        </div>
                      </div>


                    )
                  })

                }


              </div>
            </div>


            <div className='pt-20'>
              <PaginationTwo
                total_count={state.total_page}
                current_page_count={state.curr_page}
                count={state.count}
                next={state.next}
                previous={state.previous}
                on_previous_click={() => {
                  fetchPrevReleasePackages(null, state.previous);
                }}
                on_next_click={() => {
                  fetchNextReleasePackages(null, state.next);
                }}
                on_pageNumber_click={(pageNumber) => {
                  fetchPageReleasePackages(pageNumber);
                }}
                skeleton={state.loading}
              />
            </div>
          </>
      }
      {openDialog &&
        <AddOptionDialog
          open={openDialog}
          handleClose={handleCloseDialog}
        />
      }
    </div>
  )
}

const ReleasePackageItemSkeleton = () => {
  return (
    <div className='data-tab'>
      <div className='d-flex f-direction-column' style={{ gap: '3px' }}>
        <GenericSkeleton height={21} width={'65%'} style={{ borderRadius: '4px' }} />
        <GenericSkeleton height={18} width={'75%'} style={{ borderRadius: '4px' }} />
      </div>
      {Array.from({ length: 6 }).map((_, index) => (
        <div className='d-flex align-center' style={{ gap: '10px' }}>
          <GenericSkeleton height={36} width={36} style={{ borderRadius: '6px' }} />
          <div className='d-flex f-direction-column width-full' style={{ gap: '3px' }}>
            <GenericSkeleton height={21} width={'75%'} style={{ borderRadius: '4px' }} />
            <GenericSkeleton height={18} width={'65%'} style={{ borderRadius: '4px' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const FreezeSwitch = ({
  id,
  isReleasePackageFreezed,
  handleFreezeRelease = () => { },
  error
}) => {

  const { hasPermission, permissions } = usePermissions();

  const freezeUrl = GenerateEndpointURL(
    { release_package_id: id },
    properties.api.freeze_release_package,
    true
  );

  const is_freezePermited = useMemo(() => hasPermission('POST', freezeUrl), [permissions, id]);
  console.log(is_freezePermited, 'freeze_permitted_001');


  return (
    <Box sx={{ '& .input-component': { marginBottom: 0 } }} className="switch-input-wrapper-v2">
      {
        is_freezePermited ?
          <Input
            type="only-switch"
            data={{ freeze_release_package: isReleasePackageFreezed }}
            name="freeze_release_package"
            error={{ freeze_release_package: false }}
            onChangeHandler={() => handleFreezeRelease(isReleasePackageFreezed, id)}
          />
          :
          <Tooltip title={"You are not allowed to perform this action"} arrow>
            <span>
              <Input
                type="only-switch"
                data={{ freeze_release_package: isReleasePackageFreezed }}
                name="freeze_release_package"
                error={{ freeze_release_package: false }}
                onChangeHandler={() => { }}
              />
            </span>

          </Tooltip>

      }

    </Box>
  )
}

export const PopoverDropdown = ({ name,
  id,
  handleRefresh,
  isEditable,
  variant,
  onDatabaseSelect,
  isRunning,
  isFromReleaseTicket,
  totalData,
  freeze_window_data,
  forceEditEnable,
  isReleasePackageFreezed,
}) => {
  const classes = useStylesPopover();
  const { hasPermission, permissions } = usePermissions();
  const [anchorEl, setAnchorEl] = useState(null);
  const [state, setState] = useState({

  })

  const navigate = useNavigate();

  const handleClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  var url;
  if (variant == "database") {
    url = GenerateEndpointURL(
      { database_id: id },
      properties.api.edit_database,
      true
    );
  } else {
    url = GenerateEndpointURL(
      { release_package_id: id },
      properties.api.get_release_package,
      true
    );
  }
  const is_edit_permited = useMemo(() => hasPermission('POST', url), [permissions, id]);

  const open = Boolean(anchorEl);

  var database_edit = true;

  function reSyncClick() {
    navigate(`/release-package/${id}/?resync=true`);
  }

  const app_wise_service = getAppWiseServices(totalData?.change_set)

  return (
    <>
      {
        variant == "database" ?
          <span className='ri-more-2-fill font-20' onClick={handleClick} style={{ marginLeft: "16px", cursor: "pointer" }} role='button' tabIndex={0} onKeyDown={() => { }}></span>
          :
          <div className={classes.root} style={open ? { borderColor: "#0086FF" } : {}} >
            <button className="btn btn-transparent" onClick={handleClick}>
              <span className='ri-more-2-fill font-20'></span>
            </button>
          </div>

      }

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{ style: { overflow: 'visible', marginTop: "10px", borderRadius: "6px", } }}
      >
        {
          variant == "database" ?
            <div className={classes.popover} style={{ width: 'auto' }}>
              <div className='font-12 cursor-pointer' style={{ padding: '3px 5px' }}>
                {
                  database_edit ?
                    <div className="menu-link" onClick={() => onDatabaseSelect(id)} role='button' tabIndex={0} onKeyDown={() => { }}>
                      <span className='ri-edit-line'></span> Edit
                    </div>
                    :
                    <Tooltip title={"You are not allowed to perform this action"} arrow>
                      <div className="menu-link">
                        <span className='ri-edit-line'></span> Edit
                      </div>
                    </Tooltip>

                }

              </div>
              {
                name == "Change Freeze" ?
                  <div style={{ padding: '3px 5px' }}>
                    <Delete
                      varient="rp_delete"
                      display_data_name={name}
                      data={{ entity_id: id, name: "deployment_freeze_window_configuration", label: 'change freeze' }}
                      refresh={handleRefresh}
                      api_link={GenerateURL({ freeze_id: id }, properties.api.single_freeze_details)}
                      is_edit_permited={true}
                    />
                  </div>
                  :
                  <div style={{ padding: '3px 5px' }}>
                    <Delete
                      varient="rp_delete"
                      display_data_name={name}
                      data={{ entity_id: id, name: "database_integration", label: 'database' }}
                      refresh={handleRefresh}
                      api_link={GenerateURL({ database_id: id }, properties.api.edit_database)}
                      is_edit_permited={database_edit}
                    />
                  </div>
              }
            </div>
            :
            variant === 'change_freeze' ?

              <div className={classes.popover} style={{ width: 'auto' }}>
                <div className='font-12 cursor-pointer' style={{ padding: '3px 5px' }}>
                  {
                    database_edit ?
                      <div className="menu-link" onClick={() => onDatabaseSelect(id)} role='button' tabIndex={0} onKeyDown={() => { }}>
                        <span className='ri-edit-line'></span> Edit
                      </div>
                      :
                      <Tooltip title={"You are not allowed to perform this action"} arrow>
                        <div className="menu-link">
                          <span className='ri-edit-line'></span> Edit
                        </div>
                      </Tooltip>

                  }

                </div>
                <div style={{ padding: '3px 5px' }}>
                  <Delete
                    varient="rp_delete"
                    display_data_name={name}
                    data={{ entity_id: id, name: "deployment_freeze_window_configuration", label: 'Change Freeze' }}
                    refresh={handleRefresh}
                    api_link={GenerateURL({ freeze_id: id }, properties.api.single_freeze_details)}
                    is_edit_permited={database_edit}
                  />
                </div>
              </div>
              :
              <div className={classes.popover} style={{ width: 'auto' }}>
                <div className='font-12 cursor-pointer' style={{ padding: '3px 5px' }}>
                  {
                    isReleasePackageFreezed ?
                      <Tooltip title={`The release package cannot be edited because the change freeze is currently active.`} arrow>
                        <div className="menu-link">
                          <span className='ri-edit-line'></span> Edit
                        </div>
                      </Tooltip> :


                      freeze_window_data && freeze_window_data.is_edit_frozen ?
                        <Tooltip title={`The release package cannot be edited because the change freeze window "${freeze_window_data?.freeze_window_name || "N/A"} is currently active.`} arrow>
                          <div className="menu-link">
                            <span className='ri-edit-line'></span> Edit
                          </div>
                        </Tooltip>
                        :
                        (isRunning && !forceEditEnable) ?
                          <Tooltip title={"You cannot edit a Release Package while it's running, as it may cause conflicts with the currently executing pipeline."} arrow>
                            <div className="menu-link">
                              <span className='ri-edit-line'></span> Edit
                            </div>
                          </Tooltip>
                          :
                          !isEditable ?
                            <Tooltip title={"Release Package is already deployed to prod , You cannot edit it now."} arrow>
                              <div className="menu-link">
                                <span className='ri-edit-line'></span> Edit
                              </div>
                            </Tooltip>
                            :
                            is_edit_permited ?
                              <Link className="menu-link" to={`/release-package/${id}/edit`}>
                                <span className='ri-edit-line'></span> Edit
                              </Link>
                              :
                              <Tooltip title={"You are not allowed to perform this action"} arrow>
                                <div className="menu-link">
                                  <span className='ri-edit-line'></span> Edit
                                </div>
                              </Tooltip>

                  }

                </div>
                {/* { isFromReleaseTicket &&
                  <div className='font-12 cursor-pointer' style={{ padding: '3px 5px' }}>
                    <div className="menu-link" onClick={reSyncClick}>
                      <span className='ri-refresh-line'></span> Re-Sync
                    </div>
                  </div>
              } */}
                <div className='font-12 cursor-pointer' style={{ padding: '3px 5px' }}>
                  {/* <Tooltip title={"Download Release Notes"} arrow> */}
                  <div className="menu-link">
                    <span className='ri-download-2-line mr-2 font-14'></span>
                    <ReleaseNotesPdf
                      variant={'option-btn'}
                      releaseVersion={totalData.release_version}
                      packageType={totalData.selected_package_type}
                      releaseDescription={totalData.release_description}
                      selectedJiraTickets={totalData?.jira_stories}
                      appBasedServiceList={app_wise_service}
                      listing_download={true}
                    />
                  </div>
                </div>
                <div style={{ padding: '3px 5px' }}>
                  {
                    isReleasePackageFreezed ?

                      <Tooltip title={`The release package cannot be deleted because the change freeze is currently active.`} arrow>
                        <div className="menu-link">
                          <span className='d-flex align-center' style={{ gap: "7px" }}><span className='ri-delete-bin-7-line' style={{ color: '#505050', fontSize: '12px' }}></span><span style={{ marginRight: "7px", color: '#505050', fontSize: '12px', fontWeight: '500' }}>{"Delete"}</span></span>
                        </div>
                      </Tooltip>
                      :
                      <Delete
                        varient="rp_delete"
                        display_data_name={name}
                        data={{ entity_id: id, name: "release_package", label: 'release package' }}
                        refresh={handleRefresh}
                        api_link={GenerateURL({ release_package_id: id }, properties.api.get_release_package)}
                        is_edit_permited={is_edit_permited || true}
                      />
                  }

                </div>
              </div>

        }
      </Popover >
    </>

  )
}

export default ReleasePackageIndex

const useStyles = makeStyles({
  '@global': {
    'html, body, #root': {
      backgroundColor: '#fff !important',
    }
  },
  root: {
    padding: "20px 20px 20px 10px",
  },
  sticky: {
    position: "sticky",
    left: 0,
    background: "#fff",
    zIndex: 1
  },
  tableContainer: {
    marginTop: "12px",
    //overflowX: "auto", 
    '& .columns-heading': {
      display: "grid",
      gridTemplateColumns: "7% 11% 16% 16% 16% 16% 16% 2%",
      padding: "12px 20px 12px 0px",
      //paddingLeft:"0px",
      "& div": {
        color: "#787878",
        textTransform: "uppercase",
        fontSize: "12px",
        fontWeight: "600",
        lineHeight: "14px",
      }
    },
    "& .data-body": {
      height: "440px",
      borderTop: "1px solid #DFDEDE",
      borderBottom: "1px solid #DFDEDE",
      overflow: "auto",
      padding: '20px 0px 0px 0px',
      "& .data-tab": {
        display: "grid",
        gridTemplateColumns: "7% 11% 16% 16% 16% 16% 16% 2%",
        padding: "10px 16px 10px 0px",
        //paddingLeft:"0px",
        alignItems: "center",
        minHeight: '82px',
        '&:hover': {
          backgroundColor: '#FAFAFA',
        }
      }
    },
  },
  icon: {
    width: "32px",
    height: "32px",
    padding: "2px",
    borderRadius: '6px',
    color: "#ffffff",
    fontWeight: "500",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: "56px",
    height: "56px",
    borderRadius: "8px",
    backgroundColor: "rgba(0, 134, 255, 0.08)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#0086FF",
  }
})

export const useStylesPopover = makeStyles((theme) => ({
  root: {
    marginLeft: 'auto'

  },
  popover: {
    //width: "100%",
    display: "flex",
    padding: '10px 5px',
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "5px",
    borderRadius: "6px",
    border: "1px solid #F4F4F4",
    background: "#FFF",
    boxShadow: "0px 4px 12px 0px rgba(0, 0, 0, 0.08)",
    '& .menu-link': {
      color: '#505050',
      transition: 'transform 0.3s ease, color 0.3s ease',
      '&:hover': {
        color: '#2f2f2f',
        fontWeight: '550'
      },
      '&:visited': {
        color: '#505050',
      }
    },
    "& .rp-delete": {
      '&:hover': {
        color: '#2f2f2f !important',
        fontWeight: '550 !important'
      },
      '&:visited': {
        color: '#505050',
      }
    }
  }
}))
