import React from "react";
import PropTypes from 'prop-types';
import Dialog from '@mui/material/Dialog';
import { makeStyles } from '@mui/styles';
import { Link } from 'react-router-dom';
import Tooltip from '@mui/material/Tooltip';
import { Loading } from '../../../utils/Loading';
import { Input } from '../../../../components/genericComponents/Input';
import NewChip from "../../../../components/newChip/NewChip";
import RerunAfterFailure from '../../listing/component/RerunAfterFailure';
import FillApprovalQuestions from './FillApprovalQuestions';

const getStatusChip = (status) => {
    if (!status) return "N/A";
    const variant = status === "FAILED" ? "error" : status === "SUCCESS" ? "success" : "light";
    return <NewChip label={status} variant={variant} shape="standard" />;
};

const getTableConfig = (taskType, depType, status) => {
    if (!taskType) return { columns: [], title: "Execution details for Failed Job" };
    if ((taskType === "DEPLOY" || taskType === "ANDROID_DEPLOY") && status === "DONT_RUN")
        return { columns: ["Service", "Status", "Reason"], title: "Execution Details for Deploy Job" };
    if (taskType === "BUILD" || taskType === "GLOBAL_BUILD" || taskType === "ANDROID_BUILD")
        return { columns: ["Service", "Env", "Branch", "Status", "Logs"], title: "Execution Details for Build Job" };
    if (taskType === "DEPLOY" && depType === "canary")
        return { columns: [], title: "Canary Deploy", isCanary: true };
    if (taskType === "DEPLOY" || taskType === "GLOBAL_DEPLOY")
        return { columns: ["Service", "Env", "Status"], title: "Execution Details for Deploy Job" };
    if (taskType === "ANDROID_DEPLOY")
        return { columns: ["Service", "Env", "Status"], title: "Execution Details for Deploy Job" };
    if (taskType === "CRONJOB")
        return { columns: ["Service", "Env", "Status"], title: "Execution Details for Cronjob" };
    if (taskType === "PROMOTE" || taskType === "GLOBAL_PROMOTE")
        return { columns: ["Service", "Source Env", "Target Env", "Status", "Logs"], title: "Execution Details for Promote Job" };
    if (taskType === "JIRA_INTEGRATION")
        return { columns: ["Operation", "Issue Type", "Issue Key", "Status", "Logs"], title: "Execution Details for Jira Integration" };
    if (taskType === "REST_API")
        return { columns: ["Method", "URL", "Timeout", "Status", "Logs"], title: "Execution Details for REST API" };
    if (taskType === "CANARY_ANALYSIS")
        return { columns: ["Task Type", "Duration", "Status", "Logs"], title: "Execution Details for Canary Analysis" };
    if (taskType === "independent_job" || taskType === "dependent_job")
        return { columns: ["Service", "Duration", "Status", "Logs"], title: "Execution Details for Job" };
    if (taskType === "SNOW_INTEGRATION")
        return { columns: ["Operation", "Issue Key", "Status", "Logs"], title: "Execution Details for ServiceNow" };
    if (taskType === "ATTACH_DOCUMENTS")
        return { columns: ["Operation", "Status", "Logs"], title: "Execution Details for Documents" };
    if (taskType === "ROLLBACK")
        return { columns: ["Service", "Status"], title: "Execution details for Rollback Job" };
    return { columns: ["Service", "Status"], title: "Execution details for Failed Job" };
};


const truncateService = (name) => {
    if (!name) return "N/A";
    if (name.length > 20) return <Tooltip title={name}><span>{name.substring(0, 20)}...</span></Tooltip>;
    return name;
};

const renderRowCells = (item) => {
    const tt = item.task_type;
    if ((tt === "DEPLOY" || tt === "ANDROID_DEPLOY") && item.status === "DONT_RUN") {
        return (
            <>
                <td>{truncateService(item.service_name)}</td>
                <td>{getStatusChip(item.status)}</td>
                <td>
                    {item.manage_failure_json?.conflict_meta_data ? (
                        <>
                            <div>Canary is Already Running</div>
                            <div>Via Pipeline:{" "}
                                <Link to={`/application/${item.manage_failure_json.conflict_meta_data.project_id}/pipeline/${item.manage_failure_json.conflict_meta_data.pipeline_id}/execution/${item.manage_failure_json.conflict_meta_data.pipeline_instance_id}`}
                                    target="_blank" className="text-anchor-blue">
                                    {item.manage_failure_json.conflict_meta_data.pipeline_name}
                                </Link>
                            </div>
                        </>
                    ) : "-"}
                </td>
            </>
        );
    }
    if (tt === "BUILD" || tt === "GLOBAL_BUILD" || tt === "ANDROID_BUILD") {
        return (
            <>
                <td>{truncateService(item.service_name)}</td>
                <td>{item.env_name || "N/A"}</td>
                <td>{item.branch_name || "N/A"}</td>
                <td>{getStatusChip(item.status)}</td>
                <td><Link to={`/logs?global_task_id=${item.logs_url}`} target="_blank" className='text-anchor-blue' >View Logs</Link></td>
            </>
        );
    }
    if (tt === "DEPLOY" || tt === "GLOBAL_DEPLOY" || tt === "ANDROID_DEPLOY" || tt === "CRONJOB") {
        return (
            <>
                <td>{truncateService(item.service_name)}</td>
                <td>{item.env_name || "N/A"}</td>
                <td>{getStatusChip(item.status)}</td>
            </>
        );
    }
    if (tt === "PROMOTE" || tt === "GLOBAL_PROMOTE") {
        return (
            <>
                <td>{truncateService(item.service_name)}</td>
                <td>{item.env_name || "N/A"}</td>
                <td>{item.branch_name || "N/A"}</td>
                <td>{getStatusChip(item.status)}</td>
                <td><Link to={`/logs?global_task_id=${item.logs_url}`} target="_blank" className='text-anchor-blue' >View Logs</Link></td>
            </>
        );
    }
    if (tt === "JIRA_INTEGRATION") {
        return (
            <>
                <td>{item.operation || "N/A"}</td>
                <td>{item.issue_type || "N/A"}</td>
                <td><Tooltip title={item.issue_key}><p className='text-ellipsis-80'>{item.issue_key || "N/A"}</p></Tooltip></td>
                <td>{getStatusChip(item.status)}</td>
                <td><Link to={`/logs?global_task_id=${item.logs_url}`} target="_blank" className='text-anchor-blue' >View Logs</Link></td>
            </>
        );
    }
    if (tt === "REST_API") {
        return (
            <>
                <td>{item.method || "N/A"}</td>
                <td><Tooltip title={item.url}><p className='text-ellipsis-80'>{item.url || "N/A"}</p></Tooltip></td>
                <td>{item.timeout || "N/A"}</td>
                <td>{getStatusChip(item.status)}</td>
                <td><Link to={`/logs?global_task_id=${item.logs_url}`} target="_blank" className='text-anchor-blue' >View Logs</Link></td>
            </>
        );
    }
    if (tt === "CANARY_ANALYSIS") {
        return (
            <>
                <td>{item.task_type || "N/A"}</td>
                <td>{item.duration || "N/A"}</td>
                <td>{getStatusChip(item.status)}</td>
                <td><Link to={`/logs?global_task_id=${item.logs_url}`} target="_blank" className='text-anchor-blue' >View Logs</Link></td>
            </>
        );
    }
    if (item.dynamic_job || tt === "independent_job" || tt === "dependent_job") {
        return (
            <>
                <td>{truncateService(item.service_name || item.task_type)}</td>
                <td>{item.duration || "N/A"}</td>
                <td>{getStatusChip(item.status)}</td>
                <td><Link to={`/logs?global_task_id=${item.logs_url}`} target="_blank" className='text-anchor-blue' >View Logs</Link></td>
            </>
        );
    }
    if (tt === "SNOW_INTEGRATION") {
        return (
            <>
                <td>{item.operation || "N/A"}</td>
                <td><Tooltip title={item.issue_key}><p className='text-ellipsis-80'>{item.issue_key || "N/A"}</p></Tooltip></td>
                <td>{getStatusChip(item.status)}</td>
                <td><Link to={`/logs?global_task_id=${item.logs_url}`} target="_blank" className='text-anchor-blue' >View Logs</Link></td>
            </>
        );
    }
    if (tt === "ATTACH_DOCUMENTS") {
        return (
            <>
                <td>{item.operation || "N/A"}</td>
                <td>{getStatusChip(item.status)}</td>
                <td><Link to={`/logs?global_task_id=${item.logs_url}`} target="_blank" className='text-anchor-blue' >View Logs</Link></td>
            </>
        );
    }
    return (
        <>
            <td>{truncateService(item.service_name)}</td>
            <td>{getStatusChip(item.status)}</td>
        </>
    );
};

const ServiceListSection = ({ title, services, color, icon, badge }) => (
    <div style={{ marginBottom: "10px", marginTop: "12px", border: "1px solid #E6E6E6", borderRadius: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", borderBottom: "1px solid #E6E6E6" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span className={icon} style={{ color: "#FFFFFF" }}></span>
                </div>
                <span style={{ marginLeft: "8px", fontFamily: "Montserrat", fontWeight: '600', fontSize: "14px", color: '#2F2F2F' }}>{title}</span>
            </div>
            {badge && <div style={{ padding: "6px", backgroundColor: badge.bg, color: badge.color, fontFamily: "Montserrat", fontWeight: '700', fontSize: "12px", borderRadius: "5px" }}>{badge.text}</div>}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '9px', padding: "12px 16px" }}>
            {services.map((svc, i) => <NewChip key={i} label={svc} variant="light" shape="standard" />)}
        </div>
    </div>
);

const CanaryView = ({ failedServices, servicesContinuing }) => (
    <div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: "24px", marginTop: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "56px", height: "56px", borderRadius: "8px", backgroundColor: "#FFEBEB" }}>
                <span className='ri-alert-line' style={{ fontSize: "24px" }}></span>
            </div>
            <span style={{ fontFamily: "Montserrat", fontWeight: '600', fontSize: "16px", color: '#2F2F2F', marginLeft: "16px" }}>Continue with Failure to next Job</span>
        </div>
        <div style={{ backgroundColor: '#F5FAFF', padding: "6px", borderRadius: "6px", display: 'flex', alignItems: 'center', marginBottom: "16px" }}>
            <span className='ri-information-line' style={{ fontSize: "16px", color: "#0086FF" }}></span>
            <span style={{ color: "#2F2F2F", fontFamily: "Montserrat", fontWeight: "600", fontSize: "12px", marginLeft: "9px" }}>Failed Services will be rolled back to baseline version</span>
        </div>
        {failedServices && failedServices.length > 0 && <ServiceListSection title="Failed Services" services={failedServices} color="#E53737" icon="ri-close-fill" badge={{ bg: "#FFEBEB", color: "#E53737", text: "Rolling back to baseline" }} />}
        {servicesContinuing && servicesContinuing.length > 0 && <ServiceListSection title="Passed Services" services={servicesContinuing} color="#2EBE79" icon="ri-check-fill" badge={{ bg: "#E6FBEA", color: "#2EBE79", text: "Continuing with" }} />}
    </div>
);

const ConfirmationScreen = ({ data, complete_rollback, failed_task_dep_type, failedServices, servicesContinuing, formData, formError, onChangeHandler }) => {
    const taskType = data && data[0] ? data[0].task_type : null;
    if (complete_rollback) {
        return (
            <div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "56px", height: "56px", borderRadius: "8px", backgroundColor: "#0086FF14" }}>
                        <span className='ri-arrow-go-back-line' style={{ fontSize: "32px", color: "#0086FF" }}></span>
                    </div>
                    <span style={{ fontFamily: "Montserrat", fontWeight: '600', fontSize: "16px", color: '#2F2F2F', marginLeft: "16px" }}>Complete Rollback to baseline version</span>
                </div>
                <div style={{ backgroundColor: '#F5FAFF', padding: "6px", borderRadius: "6px", display: 'flex', alignItems: 'center', marginBottom: "16px" }}>
                    <span className='ri-information-line' style={{ fontSize: "16px", color: "#0086FF" }}></span>
                    <span style={{ color: "#2F2F2F", fontFamily: "Montserrat", fontWeight: "600", fontSize: "12px", marginLeft: "9px" }}>Rolling back all services to baseline</span>
                </div>
                {failedServices && failedServices.length > 0 && <ServiceListSection title="Failed Services" services={failedServices} color="#E53737" icon="ri-close-fill" />}
                {servicesContinuing && servicesContinuing.length > 0 && <ServiceListSection title="Passed Services" services={servicesContinuing} color="#2EBE79" icon="ri-check-fill" />}
            </div>
        );
    }
    console.log('[ConfirmationScreen]', { taskType, failed_task_dep_type, complete_rollback, dataLength: data?.length });
    if (taskType === "DEPLOY" || (taskType === "GLOBAL_DEPLOY" && failed_task_dep_type === "canary")) {
        return <CanaryView failedServices={failedServices} servicesContinuing={servicesContinuing} />;
    }
    if (taskType === "BUILD" || taskType === "GLOBAL_BUILD" || taskType === "ANDROID_BUILD" ||
        taskType === "DEPLOY" || taskType === "GLOBAL_DEPLOY" || taskType === "ANDROID_DEPLOY" ||
        taskType === "PROMOTE" || taskType === "GLOBAL_PROMOTE") {
        return (
            <div className='div-structure'>
                <p>Continue with Failure to next Job</p>
                <p><b>Please note:</b> pipeline will skip execution for following microservices:&nbsp;
                    {data.map((item, i) => <span key={i} className='chip chip-failed'>{item.service_name}</span>)}
                </p>
                <p><b>On continue:</b> pipeline will proceed with following microservices:&nbsp;
                    {servicesContinuing.map((item, i) => <span key={i} className='chip chip-success'>{item}</span>)}
                </p>
            </div>
        );
    }
    if (taskType === "JIRA_INTEGRATION") {
        const op = data[0].operation;
        const msgs = { create: "Your Jira ticket creation has failed, if you want to continue please create the Jira ticket manually and enter the details after clicking the continue.", update: "Your Jira ticket comment update has failed, if you want to continue please update the comment manually on the jira ticket and click continue.", check_conflicts: "Your Merge conflicts check has failed, Please verify and resolve the merge conflicts manually before proceeding.", create_pr: "Your PR Creation has failed, if you want to continue please create and merge pull request manually and click continue.", add_comment: "Your Jira ticket comment addition has failed, if you want to continue please update the comment on Jira ticket manually and click continue." };
        return (
            <div className='jira-integration-flow'>
                <div className='pd-20 text-center mt-20 mb-20' style={{ backgroundColor: '#F8F8F8', borderRadius: '8px' }}>
                    <p className="font-12 text-center mb-20"><b>Please Note:</b> {msgs[op] || "Your Jira ticket status transition has failed, if you want to continue please update the Jira ticket status manually and click continue."}</p>
                    {op === "create" && <Input type="text" data={formData} error={formError} onChangeHandler={onChangeHandler} placeholder="ot-961" mandatorySign label="Enter Jira Ticket" name={data[0].issue_key} />}
                </div>
            </div>
        );
    }
    if (taskType === "SNOW_INTEGRATION") {
        const op = data[0].operation;
        const msgs = { snow_create: "Your ServiceNow ticket creation has failed, if you want to continue please create the ServiceNow ticket manually and enter the details after clicking the continue.", snow_add_notes: "Your ServiceNow Add notes has failed, if you want to continue please add them manually and click continue.", snow_update_status: "Your ServiceNow ticket status update has failed, if you want to continue please update the ServiceNow ticket status manually and click continue.", snow_update: "Your ServiceNow ticket update has failed, if you want to continue please update the fields manually on the ServiceNow ticket and click continue." };
        return (
            <div className='jira-integration-flow'>
                <div className='pd-20 text-center mt-20 mb-20' style={{ backgroundColor: '#F8F8F8', borderRadius: '8px' }}>
                    <p className="font-12 text-center mb-20"><b>Please Note:</b> {msgs[op] || null}</p>
                    {op === "snow_create" && <Input type="text" data={formData} error={formError} onChangeHandler={onChangeHandler} placeholder="ot-961" mandatorySign label="Enter ServiceNow Ticket" name={data[0].issue_key} />}
                </div>
            </div>
        );
    }
    if (taskType === "ATTACH_DOCUMENTS") {
        const op = data[0].operation;
        const msgs = { download_documents: "Your Download Documents job has failed", upload_documents: "Your Upload Documents job has failed" };
        return (<div className='pd-20 text-center mt-20 mb-20' style={{ backgroundColor: '#F8F8F8', borderRadius: '8px' }}><p className="font-12 text-center"><b>Please Note:</b> {msgs[op] || "Release notes upload has failed"}, if you want to continue please click continue.</p></div>);
    }
    if (taskType === "dependent_job") {
        return (<div className='div-structure'><p>Continue with failures:</p><p><b>Please note:</b> pipeline will skip execution for following microservices:&nbsp;{failedServices.map((item, i) => <span key={i} className='chip chip-failed'>{item}</span>)}</p></div>);
    }
    const simpleMessages = { INTEGRATION: "Your Integration testing response has failed, do you still want to continue?", REST_API: "Your API call has failed, do you want to still continue?", ROLLBACK: "Rollback is failed. please re trigger the pipeline.", CANARY_ANALYSIS: "Currently we do not support retrigger for the canary analysis failed job in manage failure." };
    if (simpleMessages[taskType]) {
        return (<div className='pd-20 text-center mt-20 mb-20' style={{ backgroundColor: '#F8F8F8', borderRadius: '8px' }}><i className="ri-error-warning-line text-center" style={{ color: '#e9797e', textAlign: 'center', fontSize: '40px' }}></i><p className="font-12 text-center"><b>Please Note:</b> {simpleMessages[taskType]}</p></div>);
    }
    if (taskType && data[0]?.dynamic_job) {
        return (<div className='pd-20 text-center mt-20 mb-20' style={{ backgroundColor: '#F8F8F8', borderRadius: '8px' }}><i className="ri-error-warning-line text-center" style={{ color: '#e9797e', textAlign: 'center', fontSize: '40px' }}></i><p className="font-12 text-center"><b>Please Note:</b> Current job is failed, You are about to continue the pipeline.</p></div>);
    }
    return null;
};

const ManageFailure = (props) => {
    const classes = useStyles();
    const { open, handleClose, data, loading, error, failedStageData, failedTask,
        failedServices, servicesContinuing, pipeline_data, rerunJob,
        postContinuePipelineData, handleCompleteRollback, failed_task_dep_type,
        showTable, complete_rollback, backClicked, continueClicked,
        formData, formError, onChangeHandler, failed_stage_instance,
        filterApprovalQuestionsStage, pipeline_id, pipeline_instance_id, postFinalData } = props;

    const taskType = data && data[0] ? data[0].task_type : null;
    const isStageFailure = failedStageData && Object.keys(failedStageData).length > 0;
    const tableConfig = isStageFailure
        ? { columns: ["Stage", "Status", "Logs"], title: "Execution Details for failed stage" }
        : getTableConfig(taskType, failed_task_dep_type, data && data[0] ? data[0].status : null);
    const headerText = isStageFailure
        ? <>Stage has failed with following details : <b>{failedStageData?.name}</b></>
        : <>Job has failed with following details : <b>{failedTask && failedTask.task_name ? failedTask.task_name : "N/A"}</b></>;
    const envBadge = data && data[0] ? data[0].env_name : null;

    const renderRerunOrApproval = () => {
        if (data && data.length > 0) {
            return <RerunAfterFailure pipeline={pipeline_data} data={data} rerunJob={rerunJob} />;
        }
        if (isStageFailure) {
            return <FillApprovalQuestions stage_instance_id={failed_stage_instance && failed_stage_instance.id} pipeline_id={pipeline_id || ""} pipeline_instance_id={pipeline_instance_id || ""} postFinalData={postFinalData} stage_name={failed_stage_instance.name} btnVariant="re_attempt" stage_instance_status={failed_stage_instance && failed_stage_instance.status} questionnaires={filterApprovalQuestionsStage && filterApprovalQuestionsStage.questionnaires} />;
        }
        return null;
    };

    const renderFooter = () => {
        if (!showTable) {
            return (
                <div className='footer-right-panel d-flex align-center justify-end' style={{ gap: '12px', bottom: '16px', right: '20px' }}>
                    <button className='btn btn-outlined d-flex align-center justify-center btn-semi-bold' style={{ color: '#124D9B' }} onClick={backClicked}>BACK</button>
                    <button className='btn btn-primary d-flex align-center justify-center btn-semi-bold' onClick={postContinuePipelineData}>CONTINUE</button>
                </div>
            );
        }
        if (failed_task_dep_type === "canary") {
            return (
                <div className='footer-right-panel d-flex align-center justify-end' style={{ gap: '12px' }}>
                    <button className='btn btn-secondary d-flex align-center justify-center btn-semi-bold' style={{ backgroundColor: '#FEA111' }} onClick={handleCompleteRollback}>COMPLETE ROLLBACK</button>
                    {!(error && loading) && <>
                        {!isStageFailure && taskType !== "CANARY_ANALYSIS" && <button className='btn btn-outlined d-flex align-center justify-center btn-semi-bold' style={{ color: '#124D9B' }} onClick={continueClicked}>CONTINUE WITH FAILURE</button>}
                        {renderRerunOrApproval()}
                    </>}
                </div>
            );
        }
        return (
            <div className='footer-right-panel d-flex align-center justify-end' style={{ gap: '12px' }}>
                {!(error && loading) && <>
                    {!isStageFailure && taskType !== "CANARY_ANALYSIS" && <button className='btn btn-outlined d-flex align-center justify-center btn-semi-bold' style={{ color: '#124D9B' }} onClick={continueClicked}>CONTINUE WITH FAILURE</button>}
                    {renderRerunOrApproval()}
                </>}
            </div>
        );
    };

    const renderContent = () => {
        if (loading) return <Loading varient="light" />;
        if (error) {
            return (
                <div className='pd-20 text-center mt-20 mb-20' style={{ backgroundColor: '#F8F8F8', borderRadius: '8px' }}>
                    <i className="ri-error-warning-line text-center" style={{ color: '#e9797e', textAlign: 'center', fontSize: '40px' }}></i>
                    <p className="font-12 text-center">{typeof error === "string" ? error : error.toString()}</p>
                    <p className="font-12 text-center">Something went wrong. please contact to the Super Admin</p>
                </div>
            );
        }
        if (isStageFailure) {
            return (
                <div className={classes.tableContainer}>
                    <div className={classes.tableHeader}><span className={classes.headerTitle}>{tableConfig.title}</span></div>
                    <table className={classes.table}>
                        <thead><tr>{tableConfig.columns.map((col, i) => <th key={i}>{col}</th>)}</tr></thead>
                        <tbody><tr><td>{failedStageData.name}</td><td>{getStatusChip(failedStageData.status)}</td><td>N/A</td></tr></tbody>
                    </table>
                </div>
            );
        }
        if (!data || data.length === 0) {
            return <span className='d-flex align-center justify-center'><span className='mt-12 font-16 mr-auto font-weight-500 color-icon-secondary'>No Data Found</span></span>;
        }
        if (showTable) {
            if (tableConfig.isCanary) return <CanaryView failedServices={failedServices} servicesContinuing={servicesContinuing} />;
            return (
                <div className={classes.tableContainer}>
                    <div className={classes.tableHeader}>
                        <span className={classes.headerTitle}>{tableConfig.title}</span>
                        {envBadge && <span className={classes.stagingBadge}><NewChip label={envBadge} variant={"highlight2"} shape="standard" /></span>}
                    </div>
                    <table className={classes.table}>
                        <thead><tr>{tableConfig.columns.map((col, i) => <th key={i}>{col}</th>)}</tr></thead>
                        <tbody>{data.map((item, index) => <tr key={index}>{renderRowCells(item)}</tr>)}</tbody>
                    </table>
                </div>
            );
        }
        return <ConfirmationScreen data={data} complete_rollback={complete_rollback} failed_task_dep_type={failed_task_dep_type} failedServices={failedServices} servicesContinuing={servicesContinuing} formData={formData} formError={formError} onChangeHandler={onChangeHandler} />;
    };

    return (
        <Dialog fullWidth={true} maxWidth={'md'} open={open} onClose={handleClose} className={`${classes.root} dialog-align-corner`} aria-labelledby="max-width-dialog-title">
            <div className='d-grid ml-auto dialog-sub-component' style={{ gridTemplateColumns: '396px 650px' }}>
                <div className={'left-panel-dialog-down'}></div>
                <div className='right-panel-dialog bg-white'>
                    <>
                        <div className='font-18 font-weight-600 color-white d-flex align-center space-between' style={{ backgroundColor: '#0086ff', padding: '13.5px 20px' }}>
                            <p>Manage Failure</p>
                            <button className='btn float-cancel-button' style={{ left: '396px' }} onClick={handleClose}><span className='ri-close-line'></span></button>
                        </div>
                        <div className='d-flex align-center space-between' style={{ padding: '20px 20px' }}>
                            <p>{headerText}</p>
                        </div>
                        <div className="body-panel-wrapper" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
                            <div className="body-panel-new-one" style={{ padding: '0 20px 16px 20px', flex: 1, overflowY: 'auto', height: 'auto' }}>
                                {renderContent()}
                                {showTable && <div>
                                    <div className={classes.noteContainer}>
                                        <div className={classes.noteHeader}>
                                            <span className="ri-information-line font-24"></span>
                                            <span className={classes.noteTitle}>PLEASE NOTE</span>
                                        </div>
                                        <div className={classes.noteBody}>
                                            <p>On pipeline failure, there are three ways of recovering from failure.</p>
                                            <ol><li>Re-run the failed job</li><li>Continue to next job with failure</li><li>Complete Rollback to baseline</li></ol>
                                        </div>
                                    </div>
                                </div>}
                            </div>
                            <div style={{ padding: '0 16px 16px 0', flexShrink: 0 }}>
                                {renderFooter()}
                            </div>
                        </div>
                    </>
                </div>
            </div>
        </Dialog>
    );
};

ManageFailure.propTypes = {
    open: PropTypes.bool, handleClose: PropTypes.func, data: PropTypes.array, loading: PropTypes.bool,
    error: PropTypes.any, failedStageData: PropTypes.object, failedTask: PropTypes.object,
    failedServices: PropTypes.array, servicesContinuing: PropTypes.array, pipeline_data: PropTypes.object,
    rerunJob: PropTypes.func, postContinuePipelineData: PropTypes.func, handleCompleteRollback: PropTypes.func,
    failed_task_dep_type: PropTypes.string, showTable: PropTypes.bool, complete_rollback: PropTypes.bool,
    backClicked: PropTypes.func, continueClicked: PropTypes.func, formData: PropTypes.object,
    formError: PropTypes.object, onChangeHandler: PropTypes.func, failed_stage_instance: PropTypes.object,
    filterApprovalQuestionsStage: PropTypes.object, pipeline_id: PropTypes.any,
    pipeline_instance_id: PropTypes.any, postFinalData: PropTypes.func,
};

export default ManageFailure;

const useStyles = makeStyles((theme) => ({
    root: {
        '&.dialog-align-corner': { '& .MuiPaper-root': { maxWidth: '1100px' } },
        '& .left-panel-dialog-down': { width: '0px', overflow: 'hidden', transition: `'width 5s', 'overflow 1s'` },
        '& .body-panel-new-one': { padding: '10px 16px', height: 'calc(100vh - 120px)', overflowY: 'auto', position: 'relative' },
        '& .footer-right-panel': {
            paddingTop: '16px',
            '& .btn-semi-bold': { fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', lineHeight: '1', height: '40px', padding: '8px 16px', border: 'none', borderRadius: '6px', textShadow: '0px 2px 1px rgba(0, 0, 0, 0.25)' },
            '& .btn-outlined': { backgroundColor: '#ffffff', border: '1px solid #9DC0EE', textShadow: 'none' },
        }
    },
    tableContainer: { border: '1px solid #e0e0e0', borderRadius: '4px', overflow: 'hidden' },
    noteContainer: { border: '1px solid #e0e0e0', borderRadius: '4px', overflow: 'hidden', marginTop: '24px', background: '#DFEDFF', marginBottom: '232px' },
    tableHeader: { display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e0e0e0', fontSize: '14px', fontWeight: 600 },
    noteHeader: { display: 'flex', alignItems: 'center', color: '#0086FF', padding: '12px 6px 0 12px', fontSize: '14px', fontWeight: 700 },
    headerTitle: { fontSize: '14px', fontWeight: 600, color: '#333' },
    noteTitle: { fontSize: '14px', fontWeight: 600, color: '#0086FF', marginLeft: '12px' },
    noteBody: { padding: '0 16px 16px 41px', fontSize: '13px', color: '#0086FF', marginLeft: '10px', '& p': { margin: '0 0 18px 0' }, '& ol': { paddingLeft: '16px', margin: 0 }, '& li': { marginBottom: '3px', color: '#0086FF', cursor: 'pointer' } },
    stagingBadge: { marginLeft: 'auto', fontSize: '12px', fontWeight: 700, padding: '2px 8px' },
    table: {
        width: '100%', borderCollapse: 'collapse',
        '& thead': { backgroundColor: '#fafafa', '& th': { padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#2F2F2F', borderBottom: '1px solid #e0e0e0' } },
        '& tbody': { '& tr': { borderBottom: '1px solid #e0e0e0', '&:last-child': { borderBottom: 'none' } }, '& td': { padding: '12px 16px', fontSize: '13px', color: '#333' } }
    },
    linkText: { color: '#0086ff', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }
}));
