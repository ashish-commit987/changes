import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { prepareCssVars, styled } from '@mui/system';
import { makeStyles } from '@mui/styles';
import StageCard, { pipeline_log_missing_text } from './StageCard';
import JobExecutionCard from './JobExecutionCard';
import Header from './Heading';
import { Input } from '../../../../components/genericComponents/Input';
import GenerateURL from '../../../../util/APIUrlProvider';
import properties from '../../../../properties/properties';
import { PostData } from '../../../../util/apiInvoker';
import AlertStrip from '../../../../components/AlertStrips';
import Dialog from '@mui/material/Dialog';
import Slide from '@mui/material/Slide';

import SlidingDiv from './SlidingDiv';
import { Alert, Box, Menu, MenuItem, Tooltip } from '@mui/material';

import Snackbar from '@mui/material/Snackbar';
import { Link } from 'react-router-dom';
import BpOllyDialog from '../../../bpOlly';
import Button from '../../../../components/genericComponents/Button';
import useSystemSettings from '../../../../hooks/useSystemSettings';
import GenericSkeleton from '../../../../components/genericComponents/Skeletons/GenericSkeleton';
import { TabContext } from '../PipelineExecution';
import AutoRefreshPipelineComponent from './AutoRefreshPipelineComponent';
import PollingFrequencyNotificationComponent from './PollingFrequencyNotificationComponent';
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="left" ref={ref} {...props} />;
});


const approval = [
    {
        value: 1,
        label: "Approved"
    },
    {
        value: 2,
        label: "Disapproved"
    }
]

const yes_no_list = [
    {
        value: "yes",
        label: "Yes"
    },
    {
        value: "no",
        label: "No"
    }
]



const ExecutionCard = ({ startPollingAgain, ...props }) => {
    const [serviceTagView, setServiceTagView] = useState(null);

    const classes = useStyles();
    const pipeline_instance = props.pipeline_instance;
    const context_params = pipeline_instance && pipeline_instance.context_parameter ? pipeline_instance.context_parameter : null;
    const application_id = props.application_id;
    const closeSseForManageCanary = props.closeSseForManageCanary;
    const { stopPolling, stopAutoSyncNotifications, currentPollingFrequency, onGlobalRefresh, globalCounterForApiCall } = useContext(TabContext);

    console.log(pipeline_instance, "sdbvbsdgjcvgd")
    const [data, setData] = useState();
    const [state, setState] = useState({
        loaded: false,
        data: { approved: 1, comment: "All Good", update_context_param: "no", context_param: null },
        error: {},
        selected_tab: 1,
        logs: "",
        task_id: "",
        infiniteScrollInherits: {},
        childInherits: {},
        counter: 1,
        approval_in_progress: false,
    });
    const [open, setOpen] = useState(false)
    const requestInstanceData = props.requestInstanceData;
    const classesDialog = useStylesDialog();

    useEffect(() => {
        if (globalCounterForApiCall > 0) {
            setState(prev => ({ ...prev, counter: prev.counter + 1 }));
        }
    }, [globalCounterForApiCall])

    function showApprovalForm(stage_instance_id) {
        setState({
            ...state,
            show_approval_form: true,
            stage_instance_id: stage_instance_id
        })
    }

    function showResumeForm(stage_instance_id) {
        setState({
            ...state,
            show_resume_form: true,
            stage_instance_id: stage_instance_id
        })
    }

    function hideApprovalForm() {
        setState({
            ...state,
            show_approval_form: false,
        })
    }

    function hideResumeForm() {
        setState({
            ...state,
            show_resume_form: false,
        })
    }

    function onChangeHandler(e) {
        setState({
            ...state,
            data: {
                ...state.data,
                [e.target.name]: e.target.value
            }
        });
    }

    const rerunPipeline = (data) => {
        console.log(data, "rerrunfdsf")
        var url = GenerateURL({
            pipeline_id: pipeline_instance.pipeline.id,
            trigger_id: pipeline_instance.id,
        }, properties.api.rerun_job_after_failure);
        setState(prev_data => ({
            ...prev_data,
            rerun_pipeline_status: 'POST'
        }))
        PostData(url, data, handleSuccessContinuePipelineFailure, handleContinueFailed);
    }

    const continuePipelineFailure = (data) => {
        console.log(data, "sdfvgdsvgchvds")
        var url = GenerateURL({
            pipeline_id: pipeline_instance.pipeline.id,
            pipeline_instance_id: pipeline_instance.id,
        }, properties.api.after_failure_resume);
        setState(prev_data => ({
            ...prev_data,
            rerun_pipeline_status: 'POST'
        }))
        PostData(url, data, handleSuccessContinuePipelineFailure, handleContinueFailed);
    }


    function handleSuccessContinuePipelineFailure(data) {
        var success_msg = data && data.detail ? data.detail : "Pipeline resume successfully"
        requestInstanceData(data, state.counter);
        setState(new_state => ({
            ...new_state,
            success_msg: success_msg,
            trigger: "success",
            counter: new_state.counter + 1,
            rerun_pipeline_status: 'SUCCESS'
        }));

    }

    function handleContinueFailed(error) {
        var error_msg_obj = error && error.detail ? error.detail : error.toString();
        console.log(error_msg_obj, "error_msg_objerror_msg_obj")
        setState(new_state => ({
            ...new_state,
            error_msg: error_msg_obj,
            trigger: "failed",
            rerun_pipeline_status: 'FAILED'
        }));

    }



    function postApprovalRequest(data, stage_instance_id) {

        var url = GenerateURL({
            pipeline_id: pipeline_instance.pipeline.id,
            pipeline_instance_id: pipeline_instance.id,
            stage_instance_id: stage_instance_id
        }, properties.api.approve_pipeline);

        setState((new_state) => ({
            ...new_state,
            approval_in_progress: true
        }))

        PostData(url, data, handleSuccesApproved, handleFailedApproved, false, true);

        hideApprovalForm();
    }

    function postResumeRequest() {
        var url = GenerateURL({
            pipeline_id: pipeline_instance.pipeline.id,
            pipeline_instance_id: pipeline_instance.id,
        }, properties.api.resume_pipeline);

        try {
            var context_param = JSON.parse(state.data.context_param);
            var data = {
                update_context_param: state.data.update_context_param == "yes",
                context_param: state.data.context_param
            }
            PostData(url, data, handleSuccesApproved, handleFailedApproved);
            hideResumeForm();
        } catch (error) {
            setState({
                ...state,
                error: {
                    ...state.error,
                    context_param: "Invalid Json",
                }
            })
        }

    }

    function handleSuccesApproved(data) {
        setState((new_state) => ({
            ...new_state,
            approval_in_progress: false,
            approval_task_id: data.task_id
        }))
        requestInstanceData();
    }

    function handleFailedApproved(error) {
        console.log("error-in-approval", error);
        setState(new_state => ({
            ...new_state,
            error_msg: error?.detail ? error.detail : error?.error ? error.error : error,
            approval_in_progress: false
        }));
    }


    function showLogs(component_task_instance_id, path_arr, global_task_id) {
        if (state.childInherits.onLogIconClickFunction) {
            state.childInherits.onLogIconClickFunction(component_task_instance_id)
        }
        setState(new_state => ({
            ...new_state,
            selected_component_id: component_task_instance_id,
            logMetadata: {
                ...state.logMetadata,
                [component_task_instance_id]: {
                    path_arr: path_arr,
                    task_id: global_task_id,
                    show_breadcrumb: true
                }
            }
        }));
    }

    function closeLogs() {
        setState({
            ...state,
            logMetadata: null
        });
    }

    function closeTab(tabId) {
        var tabIds = Object.keys(state.logMetadata);
        if (tabIds.length == 1) {
            closeLogs();
            return
        }
        const index = tabIds.indexOf(tabId);

        var nextIndex = -1;
        if (index != tabIds.length - 1) {
            nextIndex = index + 1
        } else {
            nextIndex = index - 1
        }



        if (index > -1) {
            tabIds.splice(index, 1);
        }

        var newTabsData = {}
        tabIds.forEach(tabId => {
            newTabsData[tabId] = state.logMetadata[tabId]
        })

        if (state.childInherits.onLogIconClickFunction) {
            state.childInherits.onLogIconClickFunction(tabIds[nextIndex])
        }

        setState(new_state => ({
            ...new_state,
            logMetadata: newTabsData,
            selected_tab_id: tabIds[nextIndex]
        }))

    }

    function getFullScreenElement() {
        return document.fullscreenElement
            || document.webkitFullscreenElement
            || document.mozFullscreenElement
            || document.msFullscreenElement
    }
    function toggleFullScreen() {
        if (getFullScreenElement()) {
            document.exitFullscreen();
        } else {
            document.getElementById("viewFullScreenCanvas").requestFullscreen().catch(console.log)
        }
    }
    function showExecutionDialog() {
        setOpen(true)
    }
    function closeExecutionDialog() {
        setOpen(false)
    }
    function handleClose() {
        setState({
            ...state,
            trigger: null
        });
    }
    console.log(context_params, "context_params")

    const onCloseDialog = () => {
        setServiceTagView(null)
    }
    return (
        <>
            <MainDiv>
                <Header application_id={application_id}
                    onCloseDialog={onCloseDialog}
                    pipeline={pipeline_instance.pipeline}
                    pipeline_instance={pipeline_instance}
                    serviceTagView={serviceTagView}
                />

                <div className='ml-auto d-flex'>
                    {/* <button className='btn btn-primary' onClick={showExecutionDialog}>View Run Parameters</button> */}
                    {/* <button onClick={toggleFullScreen} className="btn-icon-square bg-purple-text-white"><span className="flaticon-switch-to-full-screen-button"></span></button> */}
                    {
                        (!stopPolling && !stopAutoSyncNotifications) &&
                        <PollingFrequencyNotificationComponent
                            onGlobalRefresh={onGlobalRefresh}
                            seconds={currentPollingFrequency}
                        />
                    }

                    <OptionList
                        pipeline_instance={pipeline_instance}
                        onViewParameterClick={showExecutionDialog}
                        setServiceTagView={setServiceTagView}
                    />


                </div>

            </MainDiv>
            <>
                {
                    (stopPolling && !stopAutoSyncNotifications) &&
                    <>
                        <AutoRefreshPipelineComponent onRefresh={startPollingAgain} />
                    </>
                }
            </>
            {
                state.error_msg ?
                    <div className="" style={{ margin: '0px 20px' }}>
                        <AlertStrip message={state.error_msg ? state.error_msg : "Something went worng"} variant={"error"} />
                    </div>
                    : null
            }
            {
                state.show_approval_form ?
                    <ApprovalDiv>
                        <Input
                            type="radio"
                            name="approved"
                            list={approval}
                            error={{}}
                            onChangeHandler={onChangeHandler}
                            data={state.data} />
                        <Input
                            type="text"
                            placeholder="Leave Comment"
                            name="comment"
                            error={{}}
                            onChangeHandler={onChangeHandler}
                            data={state.data} />


                        <div className="btn-section">
                            <button onClick={hideApprovalForm} className="btn-grey-outline">Dismiss</button>
                            <button className="btn-blue" onClick={postApprovalRequest} style={{ border: 'none' }}>Submit</button>
                        </div>
                    </ApprovalDiv> : null
            }
            {
                state.show_resume_form ?
                    <ApprovalDiv>
                        <Input
                            type="radio"
                            name="update_context_param"
                            label="Update Context params"
                            list={yes_no_list}
                            error={{}}
                            onChangeHandler={onChangeHandler}
                            data={state.data} />
                        <Input
                            type="text"
                            placeholder="Context params"
                            name="context_param"
                            error={state.error}
                            onChangeHandler={onChangeHandler}
                            data={state.data} />


                        <div className="btn-section">
                            <button onClick={hideResumeForm} className="btn-grey-outline">Dismiss</button>
                            <button className="btn-blue" onClick={postResumeRequest} style={{ border: 'none' }}>Submit</button>
                        </div>
                    </ApprovalDiv> : null
            }
            <MainCard>

                <ExecutionSection
                    showLogs={showLogs}
                    postFinalData={postApprovalRequest}
                    approval_task_id={state.approval_task_id}
                    show_approval_form={showApprovalForm}
                    show_resume_form={showResumeForm}
                    pipeline_instance={pipeline_instance}
                    continuePipelineFailure={continuePipelineFailure}
                    rerunPipeline={rerunPipeline}
                    rerun_pipeline_status={state.rerun_pipeline_status}
                    counter={state.counter}
                    application_id={application_id}
                    requestInstanceData={requestInstanceData}
                    closeSseForManageCanary={closeSseForManageCanary}
                    context_params={context_params}
                    approval_in_progress={state.approval_in_progress}
                />


            </MainCard>

            <Dialog
                open={open}
                TransitionComponent={Transition}
                keepMounted
                onClose={closeExecutionDialog}
                className={classesDialog.dialog_root + " " + " integrations-dialog pipeline-view-params-dialog"}
                aria-labelledby="alert-dialog-slide-title"
                aria-describedby="alert-dialog-slide-description" >
                <div className="fill-details-head d-flex align-center space-between"
                    style={{ backgroundColor: 'rgb(18, 77, 155)', padding: 14 }}>
                    <p className='color-white'>View Run Parameters</p>
                    <button className="btn btn-transparent" color="inherit" onClick={closeExecutionDialog} aria-label="close">
                        <span className='ri-close-line color-white font-18' ></span>
                    </button>
                </div>
                <div className="pd-10">
                    <div className='card custom-card-exec-paramsn m-10'>
                        <div className='card-header'>
                            <p>
                                <span>Env Type</span>
                                <span>Env Name</span>
                                <span>Service Name</span>
                                <span>Branch Name</span>
                                <span>Deployment Tag</span>
                            </p>
                        </div>
                        <div className='card-body'>

                            <ServiceHierarchy data={context_params} />
                        </div>
                    </div>
                </div>
            </Dialog>
            <Snackbar
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                open={state.trigger == "success" || state.trigger == "failed"}
                onClose={handleClose}
                autoHideDuration={6000}>
                {
                    state.trigger == "success" ?

                        <Alert severity="success" variant="filled">
                            {state.success_msg}
                        </Alert>
                        : state.trigger == "failed" ?
                            <Alert severity="error" variant="filled">
                                {state.error_msg}
                            </Alert>

                            : null
                }
            </Snackbar>
        </>
    )
}

ExecutionCard.propTypes = {
    ...PropTypes.objectOf(PropTypes.any),
};

export default ExecutionCard;

export const ServiceHierarchy = ({ data, all_services, variant }) => {
    console.log(data, all_services, variant, 'dg_kssd_dddd')

    var service_data = data && data.service_branch ? data.service_branch : null
    console.log(service_data, 'srv_dcv')
    var reorderedData = {
        "dev": service_data && service_data.dev ? service_data.dev : null,
        "qa": service_data && service_data.qa ? service_data.qa : null,
        "staging": service_data && service_data.staging ? service_data.staging : null,
        "uat": service_data && service_data.uat ? service_data.uat : null,
        "prod": service_data && service_data.prod ? service_data.prod : null
    };
    function renderEnvironments() {
        const environments = reorderedData != {} && reorderedData != null ? Object.entries(reorderedData) : [];
        console.log(environments, "environmentsenvironments")
        if (environments.some(([_, env]) => env !== null)) {
            return environments.map(([envKey, env]) => (
                envKey && env !== null ?
                    <div key={envKey} className='service-and-branch-listing'>
                        <div className='ul-styles'>{renderSubEnvironments(env, envKey)}</div>
                    </div> : null
            ));
        } else {

            return <p className='font-12 pd-10 text-center'>Run parameters are not available for the pipeline</p>
        }
    }

    function renderSubEnvironments(subEnvs, envKey) {
        { console.log(subEnvs, "fdsafdsafsafads") }
        return subEnvs ? Object.keys(subEnvs).map((subEnv) => (

            <>
                {console.log(subEnvs[subEnv], "fdsafdsafsafads")}
                {
                    subEnvs[subEnv] ?
                        renderServices(subEnvs[subEnv], subEnv, envKey)
                        : null
                }
            </>
        )) : null;
    }
    function renderServices(services, subEnv, envKey) {
        return Object.keys(services).map((service) => {
            return (

                <div key={subEnv} className='sub-env-row'>
                    <span className={getClassName(envKey)}>{envKey}</span>
                    <div>{subEnv}</div>
                    <div>{service}</div>
                    <div>{services[service].branch}</div>
                    <div>{services[service].deployment_tag ? services[service].deployment_tag : "N/A"}</div>
                </div>


            )
        }
        )

    }

    return (
        <div>
            {renderEnvironments()}
        </div>
    );
}

ServiceHierarchy.propTypes = {
    ...PropTypes.objectOf(PropTypes.any),
    data: PropTypes.any,
    all_services: PropTypes.any,
    variant: PropTypes.any,
};



const getClassName = (data) => {
    switch (data) {
        case "dev":
            return "chip-sq dev-bg";
        case "qa":
            return "chip-sq qa-bg";
        case "staging":
            return "chip-sq stagin-bg";
        case "uat":
            return "chip-sq uat-bg";
        case "prod":
            return "chip-sq dev-bg";

    }
}

const ExecutionSection = (props) => {
    const application_id = props.application_id;
    const pipeline_instance = props.pipeline_instance;

    const [hovered, setHovered] = useState(false);
    const counter = props.counter;
    const pipeline = pipeline_instance.pipeline;
    const show_approval_form = props.show_approval_form;
    const show_resume_form = props.show_resume_form;
    const showLogs = props.showLogs;
    const postFinalData = props.postFinalData;
    const approval_task_id = props.approval_task_id ? props.approval_task_id : null;
    const closeSseForManageCanary = props.closeSseForManageCanary;
    const stage_object_with_ids = getStageObjectWithIds(pipeline.stages, pipeline_instance.stage_instance);
    const continuePipelineFailure = props.continuePipelineFailure;
    const rerunPipeline = props.rerunPipeline
    const rerun_pipeline_status = props.rerun_pipeline_status ? props.rerun_pipeline_status : null;
    const requestInstanceData = props.requestInstanceData
    const approval_in_progress = props.approval_in_progress;
    const { settings, settingsLoading = true, error, specificSetting, refetch } = useSystemSettings({
        settingKey: "ENABLE_OLLY",
    });
    const openManageFailureRef = useRef(null);

    console.log(approval_in_progress, "approval_in_progressapproval_in_progress")
    function getFullScreenElement() {
        return document.fullscreenElement
            || document.webkitFullscreenElement
            || document.mozFullscreenElement
            || document.msFullscreenElement
    }
    function toggleFullScreen() {
        if (getFullScreenElement()) {
            document.exitFullscreen();
        } else {
            document.getElementById("viewFullScreenCanvas").requestFullscreen().catch(console.log)
        }
    }

    const rcaData = {
        title: 'Invalid Code Branch',
        message: 'The specified branch feature-234 does not exist in the repository.',
    };


    return (
        <>
            <ExecutionView id="viewFullScreenCanvas">

                {
                    Object.keys(stage_object_with_ids).map((key, index) => (
                        <>
                            {
                                index != 0 ?
                                    <div className="circular-arrow"><span className="flaticon-right-arrow-forward"></span></div>
                                    : null
                            }
                            <div>
                                <div
                                    className="main-vertical-div-pipeline"
                                    style={{ position: 'relative' }}

                                >
                                    {console.log(stage_object_with_ids, "stage_object_with_ids")}
                                    <StageCard
                                        stage={stage_object_with_ids[key]}
                                        count={index + 1}
                                        postFinalData={postFinalData}
                                        approval_task_id={approval_task_id}
                                        pipeline_name={pipeline?.name}
                                        app_name={pipeline?.project_name}
                                        pipeline_id={pipeline.id}
                                        pipeline_instance_id={pipeline_instance.id}
                                        show_approval_form={show_approval_form}
                                        show_resume_form={show_resume_form}
                                        context_parameter={props?.context_params}
                                        approval_in_progress={approval_in_progress}
                                        requestInstanceData={requestInstanceData}
                                    />
                                    {
                                        stage_object_with_ids[key].tasks.map(task => {
                                            console.log(task, 'task_pplmmnnm')
                                            return (
                                                <>
                                                    <JobExecutionCard
                                                        stage={stage_object_with_ids[key]}
                                                        showLogs={showLogs}
                                                        pipeline_id={pipeline.id}
                                                        counter={counter}
                                                        pipeline_instance_id={pipeline_instance.id}
                                                        stage_instance_id={
                                                            stage_object_with_ids[key].instance ?
                                                                stage_object_with_ids[key].instance.id
                                                                : null
                                                        }
                                                        task={task}
                                                        version={pipeline.version === 'v3' ? 'v3' : 'v2'}
                                                        isDynamicJob={task?.job_code}
                                                        application_id={application_id}
                                                        pipeline_instance={pipeline_instance}
                                                        requestInstanceData={requestInstanceData}
                                                        closeSseForManageCanary={closeSseForManageCanary}
                                                    />
                                                </>
                                            )
                                        })
                                    }
                                </div>
                            </div>
                        </>
                    ))
                }
                <button onClick={toggleFullScreen} style={{ position: 'fixed', bottom: '2rem', right: '1rem' }} className="btn-icon-square bg-purple-text-white exeview"><span className="flaticon-full-screen-exit"></span></button>


            </ExecutionView>
            {
                settingsLoading ?
                    <GenericSkeleton height={'36px'} width={'42px'} /> :
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', position: 'absolute', width: 'fit-content', bottom: '1rem', right: '1rem' }}>

                        {

                            specificSetting === "true" &&
                            specificSetting === "true" &&

                            <BpOllyDialog
                                rcaData={rcaData}
                                pipeline_id={pipeline.id}
                                pipeline_instance_id={pipeline_instance.id}
                                microservice="ot-Salary"
                                environment="ot-prod-to-preprod"
                                pipelineName="Clone Build"
                                data={pipeline_instance.stage_instance}
                                onManageFailure={() => {
                                    if (openManageFailureRef.current) openManageFailureRef.current();
                                }}
                            />


                        }
                        <button onClick={toggleFullScreen} className="btn-icon-square bg-purple-text-white" ><span className="flaticon-switch-to-full-screen-button"></span></button>
                    </Box>
            }




            {/* <button onClick={toggleFullScreen} className="btn-icon-square bg-purple-text-white" style={{ position: 'absolute', bottom: '1rem', right: '1rem' }}><span className="flaticon-switch-to-full-screen-button"></span></button> */}
            <SlidingDiv
                data={pipeline_instance.stage_instance}
                pipeline_post_data={pipeline}
                all_stages={pipeline.stages}
                ollyEnabled={specificSetting}
                pipeline_instance_id={pipeline_instance.id}
                pipeline_id={pipeline_instance.pipeline.id}
                pipeline_data={pipeline}
                postFinalData={postFinalData}
                onHandleOpenFillQuestions={() => { }}
                continuePipelineFailure={continuePipelineFailure}
                rerunPipeline={rerunPipeline}
                totalServices={pipeline && pipeline.components ? pipeline.components : null}
                openManageFailureRef={openManageFailureRef}
            />


        </>
    );
}

ExecutionSection.propTypes = {
    ...PropTypes.objectOf(PropTypes.any),
};

// function getNextTask(instance_name,stage_arr,task_arr,task_type){

//     if (stage_arr[stage_arr.length - 1] === instance_name) {
//         return false;
//     }

//     if (task_arr[task_arr.length - 1] === task_type) {
//         return false;
//     }

//     return true;
// }

export function getStageObjectWithIds(stages, stage_instances) {
    console.log(stages, stage_instances, "sdvcgsvdgcsd")
    const stage_object_with_ids = {};
    stages.forEach(stage => {
        stage.task_with_ids = {}
        stage.tasks.forEach(task => {
            stage.task_with_ids[task.id] = task;
        });

        stage_object_with_ids[stage.id] = stage;
    })

    let stage_arr = []

    let task_arr = []

    stage_instances.forEach((instance) => {
        stage_arr.push(instance.name)
    })

    stage_instances.forEach(instance => {
        instance.task_instance.forEach(task => {
            task_arr.push(task.task_type)
        });
    })

    stage_instances.forEach(instance => {

        instance.task_instance.forEach(task => {
            stage_object_with_ids[instance.stage_id].task_with_ids[task.task_id].instance = task
            // if(task.task_type == "CANARY_ANALYSIS"){
            //     stage_object_with_ids[instance.stage_id].task_with_ids[task.task_id].next_task = getNextTask(instance.name,stage_arr,task_arr,task.task_type)
            // }
        });

        stage_object_with_ids[instance.stage_id].instance = instance;
    })

    console.log(stage_object_with_ids, "avdcgbdsvgbcvds")

    return stage_object_with_ids;


}

const OptionList = ({ pipeline_instance, onViewParameterClick, setServiceTagView }) => {
    const [anchorEl, setAnchorEl] = useState(null);

    const open = Boolean(anchorEl);
    // const is_delete_permitted=props.is_delete_permitted
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleServiceTagClick = (type) => {
        handleClose();
        setServiceTagView(type);
    }



    return (
        <>
            <button className="btn btn-transparent"
                aria-label="more"
                aria-controls="long-menu"
                aria-haspopup="true"
                onClick={handleClick}
                style={{ padding: '10px 0px 10px 0px', marginLeft: '12px' }}
            >
                <span className='ri-more-2-fill color-tertiary font-20'></span>
            </button>
            <Menu
                id="long-menu"
                anchorEl={anchorEl}
                keepMounted
                open={open}
                onClose={handleClose}
                PaperProps={{
                    style: {
                        maxHeight: 48 * 4.5,
                        width: 'fit-content',
                    },
                }}
            >
                <MenuItem style={{ display: "grid" }} onClick={onViewParameterClick}>
                    <span className='font-12 color-secondary font-weight-600 cursor-pointer'>
                        {/* <span className="flaticon-google-drive-file" style={{color:"#505050",marginLeft:'0px'}} ></span> */}
                        View Run Parameters
                    </span>
                </MenuItem>
                {pipeline_instance?.logs_task_id ?
                    <Link
                        to={"/logs?global_task_id=" + pipeline_instance?.logs_task_id +
                            "&app_name=" + pipeline_instance?.pipeline?.project_name +
                            "&pipeline_name=" + pipeline_instance?.pipeline?.name
                        }
                        title="view logs"
                        target="_blank"
                    >
                        <MenuItem style={{ display: "grid" }}>
                            <span className='font-12 color-secondary font-weight-600 cursor-pointer width-full'>
                                {/* <span className="flaticon-google-drive-file" style={{color:"#505050",marginLeft:'0px'}} ></span> */}
                                Pipeline Logs
                            </span>
                        </MenuItem>
                    </Link>
                    :
                    <Tooltip title={pipeline_log_missing_text} arrow>
                        <MenuItem style={{ display: "grid", cursor: 'not-allowed' }}>
                            <span className='font-12 color-secondary font-weight-600 cursor-pointer width-full' style={{ cursor: 'not-allowed' }}>
                                {/* <span className="flaticon-google-drive-file" style={{color:"#505050",marginLeft:'0px'}} ></span> */}
                                Pipeline Logs
                            </span>
                        </MenuItem>
                    </Tooltip>

                }
                <MenuItem style={{ display: "grid" }} onClick={() => handleServiceTagClick(0)}>
                    <span className='font-12 color-secondary font-weight-600 cursor-pointer'>
                        {/* <span className="flaticon-google-drive-file" style={{color:"#505050",marginLeft:'0px'}} ></span> */}
                        View Tags
                    </span>
                </MenuItem>
                <MenuItem style={{ display: "grid" }} onClick={() => handleServiceTagClick(1)}>
                    <span className='font-12 color-secondary font-weight-600 cursor-pointer'>
                        {/* <span className="flaticon-google-drive-file" style={{color:"#505050",marginLeft:'0px'}} ></span> */}
                        Services for the pipeline to run on
                    </span>
                </MenuItem>
            </Menu>
        </>
    )
}

OptionList.propTypes = {
    ...PropTypes.objectOf(PropTypes.any),
};

const MainCard = styled('div')({
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0.877px 1.798px 14px 0px rgba(0, 0, 0, 0.15)',
    margin: '0px 20px 0px',
    height: '70vh',
    position: 'relative',
    '& .react-resizable-handle-se': {
        cursor: 'row-resize'
    },
    '& .react-resizable-handle': {
        position: 'absolute',
        width: '20px',
        height: '0px',
        top: '99%',
        bottom: '0!important',
        backgroundRepeat: 'no-repeat',
        backgroundOrigin: 'content-box',
        boxSizing: 'border-box',
        backgroundPosition: ' bottom right',
        padding: '0 3px 3px 0',
        left: '50%',
        '&:before': {
            content: '""',
            borderBottom: '1px solid #000',
            position: 'absolute',
            borderLeft: 'none',
            top: '50%',
            transform: 'translateY(-125%)',
            right: 0,
            display: 'inline-block',
            width: '20px',
            margin: '2px 0px'
        },
        '&:after': {
            content: '""',
            borderBottom: '1px solid #000',
            position: 'absolute',
            top: '50%',
            borderLeft: 'none',
            transform: 'translateY(-125%)',
            right: 0,
            display: 'inline-block',
            width: '20px',
            margin: '2px 0px'
        }
    },

})
const MainCardHeader = styled('div')({
    padding: '15px',
    display: 'flex',
    alignItems: 'center'
})
const MainCardBodyFullWidth = styled('div')({

})
const ExecutionView = styled('div')({
    backgroundImage: 'url(/images/bg-pipeline-view.png)',
    backgroundSize: '1%',
    position: 'relative',
    borderRadius: '8px',
    display: 'flex',
    overflowY: 'auto',
    height: '100%',
    padding: '20px 30px',
    '&:fullscreen': {
        backgroundImage: 'url(/images/bg-pipeline-view.png)',
        backgroundSize: '1%',
        overflow: 'scroll'
    },
    '& .btn-icon': {
        backgroundColor: '#6b74a8',
        '& .flaticon-switch-to-full-screen-button': {
            color: '#fff'
        }
    },
    '& .job-one': {
        height: '7rem;',
    },
    '& .vertical-border-pipeline-1': {
        height: 'calc(100% - 33.5rem);',
        width: '3px',
        backgroundColor: '#666',
        position: 'absolute',
        top: '3rem',
        left: '3rem'
    },
    '& height-fixed': {

    },
    '& button.exeview': {
        display: 'none',
    },
    '&#viewFullScreenCanvas:fullscreen button.exeview': {
        display: 'block'
    }
})
const HeadingSection = styled('div')({
    backgroundColor: '#fbfbfb',
    display: 'flex',
    alignItems: "center",
    justifyContent: 'space-between',
    border: '1px solid #ebedee',
    borderLeft: 'none',
    borderRight: 'none',
    fontSize: '14px',
    color: '#2b2b2b',
    borderRadius: '8px 8px 0px 0px',
    width: '100%',
    lineHeight: 2,
    '& .ml-auto': {
        marginLeft: 'auto',
    }
})
const LogsView = styled('div')({
    backgroundColor: '#000',
    color: '#fff',
    height: '92.5%',
    borderRadius: '0px 0px 8px 8px'
})
const ScrollableView = styled('div')({
    display: 'flex',
})
const ScrollableLogsView = styled('div')({
    display: 'block',
    position: 'relative',
    width: '100%',
    '& .logs-text': {
        fontSize: '13px',
        lineHeight: 1.5,
    },
    '& .btn-icon': {
        position: 'absolute',
        bottom: '5rem',
        right: '5rem'
    }
})
const LogsWorkFlowTree = styled('div')({
    backgroundColor: '#f6f6f6',
})
const GridView = styled('div')({
    display: "grid",
    gridTemplateColumns: '70% 1fr',
    gap: '10px',
    height: '100%',
    padding: '15px',
    overflowY: 'scroll'
})
const HeadingRightPanel = styled('div')({
    fontSize: '12px',
    color: '#000',
    padding: '5px 10px',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderBottom: '1px solid #ebedee'
})


const TreeView = styled('div')({
    '& .job-view': {
        color: '#000'
    }
})
const StageView = styled('div')({
    display: 'grid',
    gridTemplateColumns: '10% 1fr',
    color: '#000',
    borderBottom: '1px solid #ebedee',
    '& .flaticon-expand-arrow': {
        color: '#000!important'
    }
})

const ServiceList = styled('div')({
    display: 'grid',
    gridTemplateColumns: '10% 1fr 10%',
    color: '#000',
    borderBottom: '1px solid #ebedee',
    alignItems: 'center',
    paddingLeft: '30px',
    '& .flaticon-expand-arrow': {
        color: '#000!important'
    },

    '& .logs-view': {
        backgroundColor: '#000',
        color: '#0096db',
        padding: '10px'
    }
})
const ApprovalDiv = styled('div')({
    margin: '0px 32px 16px',
    display: 'grid',
    gridTemplateColumns: '18% 63% 18%',
    gap: '10px',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: "10px",
    borderRadius: '8px',
    '& .input-component': {
        marginBottom: '0px'
    },
    '& .btn-section button': {
        margin: '0px 2px'
    }
})
const MainDiv = styled('div')({
    padding: '32px 20px 16px',
    //marginTop: '16px',
    display: 'flex',
    alignItems: 'center',
    '& .pipeline-service-data': {
        margin: '0 10px'
    },
    '& .pipeline-tags-data': {
        margin: '0 10px'
    },
    '& .service-name-chip-div .chip-blue': {
        backgroundColor: 'transparent',
        margin: '0px',
        lineHeight: 0
    },
    '& button.btn-icon-square': {
        marginLeft: 'auto'
    }
})


const drawerWidth = 240;

const useStylesDrawer = makeStyles((theme) => ({
    root: {
        display: 'flex',
    },
    appBar: {
        width: `calc(100% - ${drawerWidth}px)`,
        marginRight: drawerWidth,
    },
    drawer: {
        width: drawerWidth,
        flexShrink: 0,
    },
    drawerPaper: {
        width: drawerWidth,
    },
    // necessary for content to be below app bar
    toolbar: theme.mixins.toolbar,
    content: {
        flexGrow: 1,
        backgroundColor: theme.palette.background.default,
        padding: theme.spacing(3),
    },
}));
const useStyles = makeStyles(theme => ({
    stageData: {
        display: 'flex',
        alignItems: 'center',
        padding: '0px 10px',
        lineHeight: 1.5,
        '& .main-text': {
            color: '#000',
            fontSize: '13px',
            marginRight: '0px'
        },
        '& .sub-text': {
            color: '#949494',
            fontSize: '13px'
        },
        '& .status-font': {
            fontSize: '12px',
            textTransform: 'uppercase'
        },
        '& .success': {
            color: '#62E187'
        },
        '& .success .flaticon-circle-with-check-symbol': {
            margin: '0px 0px 0px 2px',
            color: '#62E187'
        },
        '& .success .flaticon-circle-with-check-symbol:before': {
            fontSize: '14px!important',
            color: '#62E187'
        }
    },
    executionData: {
        display: 'flex',
        alignItems: 'center',
        lineHeight: 1,
        '& .main-text': {
            color: '#000',
            fontSize: '12px',
            marginRight: '0px'
        },
        '& .sub-text': {
            color: '#949494',
            fontSize: '12px'
        }
    },
    d_Flex: {
        display: 'flex',
        alignItems: 'center',
    }
}))


const useStylesDialog = makeStyles(() => ({
    dialog_root: {
        '& .MuiDialog-paperScrollPaper': {
            width: '100rem',
            backgroundColor: '#fff;'
        },
        '&.integrations-dialog': {
            '.MuiPaper-root': {
                maxWidth: '1000px!important'
            },
        },
        '.execution-params-row': {
            fontSize: '12px',
        }
    },
    dialog: {
        width: '100%',
        '& .card-sub-header': {
            backgroundColor: '#fefefe',
            borderBottom: '1px solid #eaeaea',
            padding: '5px',
            '& .heading-with-icon': {
                color: '#484848',
                fontSize: '12px',
                '& .material-icons': {
                    // fontSize: 
                }
            }
        },
        '& .no-issues-added': {
            width: '300px',
            textAlign: 'center',
            fontSize: '12px',
            margin: 'auto',
            display: 'block',
            padding: '20px'
        },
        '& .sq-chip': {
            backgroundColor: '#626262',
            color: '#fff',
            padding: '1px 3px',
            borderRadius: '4px',
            marginLeft: '3px'
        }
    },
    button_class: {
        fontSize: '12px',
        display: 'flex',
        marginBottom: '10px',
        alignItems: 'center',
        '&:hover': {
            cursor: 'pointer'
        },
        '& .small-icon-button': {
            backgroundColor: '#fff',
            marginLeft: '5px',
            border: 'none',
            boxShadow: '0.877px 1.798px 8px 0px rgba(0, 0, 0, 0.2)',
            height: '20px',
            width: '20px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0086ff'
        }
    },
    cardHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #C5C5C5',
        fontSize: '14px',
        fontWeight: 400,
        color: '#bfbfbf',
        backgroundColor: '#ffffff',
        // fontFamily: "'inter', nunito-sans, heebo, nunito, sans-serif",
        padding: '10px 20px'
    },
    cardBody: {
        // padding: '20px 20px',
        '& ul': {
            '&.headerul': {
                '& li': {
                    width: '100%',
                    textAlign: 'center',
                    fontSize: '12px',
                    // fontWeight: 300,
                    // fontFamily: "'inter', nunito-sans, heebo, nunito, sans-serif",
                    borderBottom: '1px solid #a3a3a3',
                    color: '#000',
                    '&.active': {
                        color: '#000',
                        borderBottom: '2px solid #124D9B'
                    }
                }
            }
        }
    },
    card_shadow: {
        boxShadow: ' 0 3px 4px 0 rgba(0, 0, 0, 0.1), 0 4px 8px 0 rgba(0, 0, 0, 0.1)',
        color: '#6e6e6e',
        borderRadius: '25px',
        fontSize: '13px',
        width: '450px',
        height: '50px',
        padding: '15px',
        marginTop: '25px',
        display: 'flex', flexDirection: 'row', justifyContent: 'space-between',
    },
    button_code: {
        backgroundColor: '#007eff',
        border: 'none',
        color: 'white',
        padding: '11px 32px',
        textAlign: 'center',
        textDecoration: 'none',
        display: 'inline-block',
        fontSize: '11px',
        margin: '4px 2px',
        cursor: 'pointer',
        float: 'right',
        width: '110px',
        height: '38px',
    },
    title_block: {
        borderBottom: "1px solid #a09e9e", padding: "15px", backgroundColor: '#f4f4f4', display: 'flex', justifyContent: 'space-between',
    },
    condition_block: {
        display: 'flex', alignItems: 'center', borderBottom: "1px solid #a09e9e", borderTop: '1px solid #a09e9e', padding: "8px", backgroundColor: '#f4f4f4', justifyContent: 'space-between',
    }
}));
