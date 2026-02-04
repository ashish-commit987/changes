import React, { useEffect, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import GenerateURL from '../../../../util/APIUrlProvider';
import properties from '../../../../properties/properties';
import InvokeApi, { PostData } from '../../../../util/apiInvoker';
import moment from 'moment';
import Tooltip from '@mui/material/Tooltip';
import { LoadingText } from '../../../utils/Loading';
import { getDuration, showErrorHandlerUpdated } from '../../../../util/util';
import ActivityStepDetails from '../../../superAdmin/activityFramework/components/ActivityStepDetails';
import { useParams } from "react-router-dom";
import { useCustomSnackbar } from '../../../../contexts/SnackbarContext';
import GenericSkeleton from '../../../../components/genericComponents/Skeletons/GenericSkeleton';


const LatestPromoteStrip = (props) => {
  const type = "PROMOTE";
  const service_id = props.service_id;
  const env_id = props.env_id;
  console.log(env_id,"Fdsafsaf")
  const workspace_base_url = properties.workspace_url;
  const service_data = props.service_data;
  const env_name = props.env_name;
  const top_summary_data = props.top_summary_data;
  const params = useParams();
  const { showSnackbar } = useCustomSnackbar();
  const application_id = params.application_id;

  var event_source = null
  var component_env = service_data && service_data.component_env ? service_data.component_env.map(x =>
    (x.project_env && x.project_env.name)
  ) : []
  component_env = component_env ? component_env.map(item => (item)) : null
  var service_name = service_data.name ? service_data.name : top_summary_data ? top_summary_data.service_name : null;

  var service_env = service_data.env ? service_data.env : top_summary_data ? top_summary_data.env_name : null;
  service_env = service_env ? service_env.toLowerCase() : null;


  var service_env_type = service_data.type ? service_data.type : top_summary_data ? top_summary_data.type : null;
  service_env_type = service_env_type.toLowerCase();
  var revokeUrlPath = properties.api.env_promote_revoke_url;
  var refresh_count = props.refresh_count;
  const [state, setState] = useState({
    history_list: [],
    activity_list: []
  });

  const promoteId = state.last_promote  && state.last_promote.id? state.last_promote.id : null

  const promote_status =  state?.last_promote?.activity_status?.status
  const promote_by_user = useMemo(()=>getBuildByUserName(state.last_promote),state.last_promote)
  const image  = state?.last_promote?.current_image_tag
  const promote_number = state?.last_promote?.promote_number

  const workspaceParams = {action_number: promote_number, action_status : promote_status, action_by: promote_by_user, image:image  }

  useEffect(()=>{
    removeArrData()
   
  },[promoteId])  
 
  function getEnvNamefromId() {
    var env_name = "";
    if (service_data && service_data.component_env) {
      service_data.component_env.map(item => {
        if (item.id == env_id) {
          env_name = item.project_env.name
        }
      })
    }
    return env_name;
  }
  var service_env_name = service_env ? service_env : getEnvNamefromId()
  function fetchRecentBuildDeployData() {
    var requestInfo = {
      endPoint: GenerateURL({ service_id: service_id, env_id: env_id }, properties.api.env_ci_cd_data_url+"?type=promote"),
      httpMethod: "GET",
      httpHeaders: { "Content-Type": "application/json" }
    }
    setState(new_state => ({
      ...new_state,
      loading: true
    }));
    InvokeApi(requestInfo, onfetchRecentBuildDeployDataSuccess, onfetchRecentBuildDeployDataFail);
   
  }

  function onfetchRecentBuildDeployDataSuccess(response) {
    
    console.log('success_reponse',response);
    setState(new_state => ({
      ...new_state,
      ci_cd_data: response,
      last_build: response.last_build,
      last_deploy: response.last_deploy,
      last_promote: response.last_promote,
      loading: false
    }));

  }

  function onfetchRecentBuildDeployDataFail(response) {
    console.log('error_response',response);

    setState(new_state => ({
      ...new_state,
      error: response,
      loading: false
    }));
  }

  useEffect(() => {
    fetchRecentBuildDeployData();
    
  }, [type, env_id, refresh_count])


 


  function getPromotedByUser(history) {
    return (
      <>{history.promote_by_pipeline ?
        <div className='text-ellipsis-twoline'>
          <p>Pipeline: {history.promote_by_pipeline.pipeline.name}</p>
          <p>Triggered by: {history.promote_by_pipeline.trigger_by}</p> 
        </div >
        : <span className='text-ellipsis-110'>{history.promote_by_user}</span>
      }</>
    )

  }


  function onRevoke(task_id) {
    var url_temp = GenerateURL({ service_id: service_id, env_id: env_id, id: task_id }, revokeUrlPath);
    var fetchOptions = {
      endPoint: url_temp,
      httpMethod: "GET",
      httpHeaders: { "Content-Type": "application/json" }
    }
    showSnackbar('info', 'Revoking promotion...')
    PostData(url_temp, {}, handleSuccessRevoke, handleFailedRevoke);
    
    setState(new_state => ({
      ...new_state, history_info_status: "REQUESTED",
    }));
  }
  function handleSuccessRevoke(respone) {
    showSnackbar('success', 'Promotion revoked successfully.')
    setState(new_state => ({
      ...new_state,
      history_info_status: "SUCCESS",
      loading: false
    }));
    props.refresh();
  }
  function handleFailedRevoke(error) {
    const error_msg = showErrorHandlerUpdated(error)
    showSnackbar('error', 'Failed to revoke promotion', error_msg)
    setState(new_state => ({
      ...new_state,
      history_info_status: "SUCCESS",
      error: true,
      loading: false
    }));
  }


  function getClassbyActivityStatus(activity_status, type) {
    if (type == "Revoke") {
      if (activity_status && activity_status == "IN_QUEUE" || activity_status && activity_status == "RUNNING")
        return "btn btn-flaticon"
      else
        return "btn btn-disabeld-flaticon"
    } else {
      if(type === "Resume"){
        if( (activity_status && activity_status == "IN_QUEUE" || activity_status && activity_status == "RUNNING") ||activity_status && activity_status == "SUCCESS" )
        return "btn btn-disabeld-flaticon btn-mui-svg"
    else
        return "btn btn-flaticon btn-mui-svg"
    }else{
        if( activity_status && activity_status == "IN_QUEUE" || activity_status && activity_status == "RUNNING" )
        return "btn btn-disabeld-flaticon"
    else
        return "btn btn-flaticon"
    }
    
    }
  }
  function callFunctionbyStatus(activity_status, id) {
    if (activity_status && activity_status == "IN_QUEUE" || activity_status && activity_status == "RUNNING")
      onRevoke(id)
  }

  function onResume(id) {
    var url_temp = GenerateURL({ service_id: service_id, env_id: env_id, id: id }, properties.api.promote_resume);
    var fetchOptions = {
        endPoint: url_temp,
        httpMethod: "GET",
        httpHeaders: { "Content-Type": "application/json" }
    }
    showSnackbar('info', 'Scheduling Promote')

    PostData(url_temp, {}, handleSuccessResume, handleFailedResume);

}


function handleSuccessResume(respone) {
  showSnackbar('success', 'Promotion scheduled successfully')   

    setState(new_state => ({
        ...new_state,
        show_loading_icon: false
    }));
}

function handleFailedResume(error) {
  let error_msg = showErrorHandlerUpdated(error)
  showSnackbar('error', 'failed to  Promote', error_msg)
    setState(new_state => ({
        ...new_state,
        error: true,
        show_loading_icon: false
    }));
}

function callResumeFunctionbyStatus(activity_status, id) {
    if (( activity_status != "IN_QUEUE" || activity_status != "RUNNING") || activity_status != "SUCCESS")
        onResume(id)
}



  function getActivityCurrentInfo(activity_id) {
    var requestInfo = {
      endPoint: GenerateURL({ activity_id: activity_id }, properties.api.get_current_activity_status),
      httpMethod: "GET",
      httpHeaders: { "Content-Type": "application/json" }
    }
    InvokeApi(requestInfo, getActivityCurrentInfoSuccess, getActivityCurrentInfoFailure);
  
    
  }

  function getActivityCurrentInfoSuccess(response) {
    if (response && response.results.length > 0) {
      setState(new_state => ({
        ...new_state,
        activity_list: [...response.results],
        activity_step_details: {
          open_div : true 
      }
      }));
    }
    
  }

  const removeArrData = () => {
    setState(new_state => ({
      ...new_state,
      activity_list: [],
      activity_step_details: {
        open_div : state.activity_list.length > 0 ?  true : false
    }
    }));
  }
  function getActivityCurrentInfoFailure(error, exception) {
    setState(new_state => ({
      ...new_state,
      error: true
    }));
  }



  console.log(state,'promote_strip_0001')

  const onHandleBuildRefresh = (type)=> {

    props.refresh()
      getActivityCurrentInfo(state.last_promote && state.last_promote.activity_status ? state.last_promote.activity_status.id ? state.last_promote.activity_status.id : "" : "")
  }

  function getBuildByUserName (history){
    console.log(history,'hshhshshs');
      if(history){

        if(history.promote_by_pipeline){
          return history.promote_by_pipeline.trigger_by
        }
          
        else 
          return  history.promote_by_user

      }
  }

  console.log(getBuildByUserName(state.last_build),'hereh_data_now')

  console.log("State Last Promote", state.last_promote);;

  function getHeaderBasedOnType() {
        return (
          <>
            <th>Type</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Date/Time</th>
            <th>Artifact</th>
            <th>Promoted Info</th>
            <th></th>
            <th><button className="btn-round border-navy bg-clear-btn" icon="flaticon" onClick={()=>onHandleBuildRefresh(type)}><span className="flaticon-refresh-button-1"></span></button></th>
          </>
        );
    }




  function getBodyBasedOnType() {

        return (
          <>
            {state.last_promote && state.last_promote.activity_status ? (
              <>
                <tr>
                  <td>
                    <a
                      className="cursor-pointer text-anchor-blue"
                      target="_blank"
                      href={
                        "/logs?global_task_id=" +
                        state.last_promote.global_task_id +
                        "&tab_id=" +
                        state.last_promote.id +
                        "&service_name=" +
                        service_name +
                        "&service_env=" +
                        service_env +
                        "&service_type=" +
                        service_env_type +
                        "&tab_name=DEPLOY" +
                        "&num=" +
                        state.last_promote.promote_number
                      }
                    >
                      Promote#{state.last_promote.promote_number}
                    </a>
                  </td>
                  <Tooltip title={state?.last_promote?.activity_status?.status}>
                    <td>
                      <div className="d-flex align-center">
                        {state.last_promote.activity_status.status ? (
                          <p
                            className={
                              state.last_promote.activity_status.status ==
                              "FAILED"
                                ? "round-chip bg-round-red status-font"
                                : state.last_promote.activity_status.status ==
                                    "RUNNING"
                                  ? "round-chip bg-round-blue status-font"
                                  : state.last_promote.activity_status.status ==
                                      "REVOKED"
                                    ? "round-chip bg-round-purple status-font"
                                    : state.last_promote.activity_status
                                          .status == "IN_QUEUE"
                                      ? "round-chip status-chip-info status-font"
                                      : "round-chip bg-round-green status-font"
                            }
                          >
                            {state.last_promote.activity_status.status}
                          </p>
                        ) : (
                          "N/A"
                        )}
                      </div>
                    </td>
                  </Tooltip>
                  <td>
                    {state.last_promote.activity_status.status &&
                    state.last_promote.activity_status.status != "RUNNING"
                      ? getDuration(
                          new Date(state.last_promote.updated_at),
                          new Date(state.last_promote.created_at),
                        ) == 0
                        ? "--"
                        : getDuration(
                            new Date(state.last_promote.updated_at),
                            new Date(state.last_promote.created_at),
                          )
                      : getDuration(
                          new Date(state.last_promote.created_at),
                          new Date(),
                        )}
                  </td>
                  <td>{moment(state.last_promote.created_at).fromNow()}</td>
                  <td>{state.last_promote.target_image_tag}</td>
                  <td>
                    <div className="d-flex align-center">
                      <span className="color-dark mb-0">Promoted by: </span>{" "}
                      <span>{getPromotedByUser(state.last_promote)}</span>
                    </div>
                    <div className="d-flex align-center">
                      <span className="color-dark mb-0">Promoted from: </span>
                      <Tooltip
                        title={
                          state.last_promote.env_cd_detail &&
                          state.last_promote.env_cd_detail.deployment_name
                            ? state.last_promote.env_cd_detail.deployment_name
                            : "N/A"
                        }
                      >
                        <span className="text-ellipsis-110 d-block">
                          {state.last_promote.env_cd_detail &&
                          state.last_promote.env_cd_detail.deployment_name
                            ? state.last_promote.env_cd_detail.deployment_name
                            : null}
                        </span>
                      </Tooltip>
                    </div>
                    <div className="d-flex align-center">
                      <span className="color-dark mb-0">Promoted to: </span>
                      <Tooltip
                        title={
                          state.last_promote.target_env_cd_detail &&
                          state.last_promote.target_env_cd_detail
                            .deployment_name
                            ? state.last_promote.target_env_cd_detail
                                .deployment_name
                            : "N/A"
                        }
                      >
                        <span className="text-ellipsis-110 d-block">
                          {state.last_promote.target_env_cd_detail &&
                          state.last_promote.target_env_cd_detail
                            .deployment_name
                            ? state.last_promote.target_env_cd_detail
                                .deployment_name
                            : null}
                        </span>
                      </Tooltip>
                    </div>
                  </td>

                  <td colSpan="2">
                    <div className="btn-group btn-icon-group width-fitcontent ml-auto">
                      <Tooltip title="View Activity Details">
                        <button
                          className="btn btn-flaticon"
                          onClick={() => {
                            getActivityCurrentInfo(
                              state.last_promote.activity_status.id
                                ? state.last_promote.activity_status.id
                                : "",
                            );
                          }}
                        >
                          
                          <span
                            className="ri-menu-add-fill"
                            style={{ color: "#0086ff"}}
                          ></span>
                        </button>
                      </Tooltip>

                      {state.last_promote &&
                      state.last_promote.promote_by_pipeline ? (
                        <Tooltip title="Resume">
                          <button
                            className={"btn btn-disabeld-flaticon btn-mui-svg"}
                          >
                            
                            <span className="ri-upload-fill" ></span>
                          </button>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Resume">
                          <button
                            className={
                              state.last_promote.activity_status.status
                                ? getClassbyActivityStatus(
                                    state.last_promote.activity_status.status,
                                    "Resume",
                                  )
                                : ""
                            }
                            onClick={
                              state.last_promote.activity_status.status
                                ? () =>
                                    callResumeFunctionbyStatus(
                                      state.last_promote.activity_status.status,
                                      state.last_promote.id,
                                    )
                                : () => {}
                            }
                          >
                           
                            <span className="ri-skip-forward-fill" ></span>
                          </button>
                        </Tooltip>
                      )}
                      {state.history_info_status === "REQUESTED" ? (
                        <GenericSkeleton
                          style={{ borderRadius: "4px" }}
                          height={"36px"}
                          width={"36px"}
                        />
                      ) : state.last_promote.target_env_cd_detail &&
                        state.last_promote.target_env_cd_detail.component_env &&
                        state.last_promote.target_env_cd_detail.component_env
                          .id ? (
                        state.last_promote.target_env_cd_detail.component_env
                          .id == env_id ? (
                          <Tooltip title="Revoke">
                            <button
                              className={"btn btn-disabeld-flaticon"}
                              // title="Revoke Promote"
                            >
                              
                              <span className="ri-stop-fill" ></span>
                            </button>
                          </Tooltip>
                        ) : (
                          <Tooltip
                            title={
                              state.last_promote.promote_by_pipeline
                                ? "This task has been triggered by a pipeline, please revoke the pipeline in order to revoke the task"
                                : "Revoke"
                            }
                          >
                            <button
                              className={
                                state.last_promote.activity_status.status &&
                                !state.last_promote.promote_by_pipeline
                                  ? getClassbyActivityStatus(
                                      state.last_promote.activity_status.status,
                                      "Revoke",
                                    )
                                  : "btn btn-disabeld-flaticon"
                              }
                              onClick={
                                state.last_promote.activity_status.status &&
                                !state.last_promote.promote_by_pipeline
                                  ? () =>
                                      callFunctionbyStatus(
                                        state.last_promote.activity_status
                                          .status,
                                        state.last_promote.id,
                                      )
                                  : null
                              }
                            >
                              
                              <span className="ri-stop-fill" ></span>
                            </button>
                          </Tooltip>
                        )
                      ) : (
                        <Tooltip title="Revoke">
                          <button className={"btn btn-disabeld-flaticon"}>
                            
                            <span className="ri-stop-fill" ></span>
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  </td>
                </tr>
                {state.activity_list.length > 0 ? (
                  <ActivityStepDetails
                    activityDetail={state.activity_list}
                    tableGird={true}
                    colSpan={8}
                    removeArrData={() => {
                      removeArrData();
                    }}
                    prev_state={state.activity_step_details}
                    logUrl={
                      "/logs?global_task_id=" +
                      state.last_promote.global_task_id +
                      "&tab_id=" +
                      state.last_promote.id +
                      "&service_name=" +
                      service_name +
                      "&service_env=" +
                      service_env +
                      "&service_type=" +
                      service_env_type
                    }
                  />
                ) : null}
              </>
            ) : (
              <tr>
                <td colSpan="9">
                  <div className="blank-div">
                    <div className="blank-div-text">No Data Found</div>
                  </div>
                </td>
              </tr>
            )}
          </>
        );
  }
  function getStatusBasedOnType() {
        return (
          <p className="font-12 pd-10 ">Recent Promote History</p>
        );
  }
  var status = state.history_list.map(item => (item.status));

  return (
    <>
      {/* {
                status.includes("IN_QUEUE"|| "RUNNING" || "FAILED") && */}
      <div className="d-flex align-center space-between border-bottom">
        {getStatusBasedOnType()}
       
      </div>

      <table className="table table-responsive single-row single-row-data">
        <thead>
          {getHeaderBasedOnType()}
        </thead>
        {state.loading ?
          <tr>
            <td colSpan="8">
              <div className="h-12">
                <LoadingText />
              </div>

            </td>
          </tr>
          : <> {getBodyBasedOnType()}</>
        }

      </table>
      {/* } */}
      

    </>
  )
}

LatestPromoteStrip.propTypes = {
  ...PropTypes.objectOf(PropTypes.any),
}

export default LatestPromoteStrip;
