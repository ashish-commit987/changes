import { makeStyles } from '@mui/styles';
import Dialog from '@mui/material/Dialog';
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { dashboard_feature, other_feature, primary_feature, matric_feature } from './kubeconfigPermission';
import properties from '../../../../properties/properties';
import GenerateURL from '../../../../util/APIUrlProvider';
import InvokeApi, { PostData } from '../../../../util/apiInvoker';
import StepProgressDetailed from '../../../../components/genericComponents/StepProgressDetailed';
import Button from '../../../../components/genericComponents/Button';
import { useCustomSnackbar } from '../../../../contexts/SnackbarContext';

const ClusterPermissions = () => {
    const { showSnackbar } = useCustomSnackbar();
    const classes = useStyles();
    const location = useLocation();
    const { cluster_id, task_id } = location.state || { cluster_id: null, task_id: null };
    const search = location.search;
    const params = new URLSearchParams(search);
    //const cluster_id = params.get('cluster_id');
    const primaryFeature = getObjectArray(primary_feature)
    const dashboardFeature = getObjectArray(dashboard_feature)
    const otherFeature = getObjectArray(other_feature)
    // const metricFeature = getObjectArray(matric_feature)
    const [metricFeature, setMetricFeature] = useState(matric_feature)
    const [sectionOpener, setSectionOpener] = useState({
        primary: false,
        dashboard: false,
        other: false,
        metric: false,
    })
    const [state, setState] = useState({
        loading: true,
        setup_loading: false,
        permission_verbs_json: {},
        metric_server_setupe: false,
    });
    const [openDialog, setOpenDialog] = useState(false);

    const [defaultPermisson, setDefaultPermisson] = useState(false);

    console.log(state.permission_verbs_json, metricFeature, "ajhbadhbchjdabcjhda")

    function getPermissions() {
        var requestInfo = {
            endPoint: GenerateURL({ cluster_id: cluster_id }, properties.api.kubeConfigPermissions),
            httpMethod: "GET",
            httpHeaders: { "Content-Type": "application/json" }
        }

        // requestInfo.endPoint = GenerateSearchURL({ cluster_id: cluster_id ? cluster_id : "" }, requestInfo.endPoint)

        InvokeApi(requestInfo, handleSuccessApiHit, handleFailedApiHit, false);
    }
    function handleSuccessApiHit(response) {
        setState(prevState => ({
            ...prevState,
            loading: false,
            cluster_name: response.cluster_name,
            infra_provicder_name: response.infra_provicder_name,
            permission_verbs_json: response.cluster_verbs.verbs_json,
        }))
    }
    function handleFailedApiHit(error) {
        console.log("bcdjdja", error);
        setState(prevState => ({
            ...prevState,
            loading: false,
            error: error
        }));
    }


    useEffect(() => {
        if (cluster_id) {
            getPermissions();
        } else {
            setDefaultPermisson(true);
        }
    }, [cluster_id])

    function toggleSection(section) {
        setSectionOpener(prevState => ({
            ...prevState,
            [section]: !prevState[section]
        }))
    }

    function getObjectArray(obj) {
        const keys = Object.keys(obj);
        console.log(keys);
        return keys.map(key => obj[key]);
    }
    function getPermissionIcon(permission) {
        switch (permission) {
            case "get":
                return "ri-file-add-line"
            case "list":
                return "ri-play-list-add-fill"
            case "watch":
                return "ri-eye-line"
            case "create":
                return "ri-star-s-line"
            case "update":
                return "ri-notification-badge-line"
            case "delete":
                return "ri-delete-bin-7-line"
            case "patch":
                return "ri-tools-line"
            default:
                return "ri-file-add-line"
        }
    }

    const handleCloseDialog = () => {
        setOpenDialog(false);
    }
    const handleOpenDialog = () => {
        setOpenDialog(true)
    }
    const handleSetupeMatrics = () => {
        showSnackbar("info", "Setting up metric server...");
        setState((prev) => ({ ...prev, setup_loading: true }));
        PostData(GenerateURL({ cluster_id: cluster_id }, properties.api.metric_server_setup), {}, handleSuccessMetricServer, handleFailedMetricServer);
    }
    function handleSuccessMetricServer(response) {
        showSnackbar("success", "Metric server setup initiated successfully.");
        console.log(response, "dsfsdfsdfsdffsf")
        setState(prevState => ({
            ...prevState,
            setup_loading: false,
            metric_task_id: response.task_id,
            metric_server_setupe: true,
        }));
        setOpenDialog(false);
    }
    function handleFailedMetricServer(error) {
        showSnackbar("error", "Failed to setup metric server. Please try again.");
        setState(prevState => ({
            ...prevState,
            setup_loading: false,
            error: error
        }));
        setOpenDialog(false);
    }
    console.log(state.permission_verbs_json, "djksjdk");

    function returnKey(arr) {
        let index = 0;
        return function* () {
            while (index < arr.length) {
                yield arr[index++];
            }
        }();
    }

    return (
        <>
            {state.metric_server_setupe ?
                <>
                    <StepProgressDetailed task_id={state.metric_task_id} placeholders={{ cluster_id: cluster_id }} type="new" />
                </>
                :
                <>
                    <div className='m-20'>
                        {/* {cluster_id ?
                    <div className={classes.dynamicHeader}>
                        <div className='left-part'>
                            <div className='top-part'>
                                <span className='font-18 font-weight-500 color-value'>Permissions Details</span>
                                <span className='status-chip-failed'>Failed</span>
                            </div>
                            <div className='bottom-part'>
                                <div>
                                    <span className='key font-14 font-weight-400 color-icon-secondary'>Cluster:</span>
                                    <span className='value font-14 font-weight-600 color-icon-secondary'> {state.cluster_name ? state.cluster_name : 'NA'}</span>
                                </div>
                                <div>
                                    <span className='key font-14 font-weight-400 color-icon-secondary'>Infra Provider:</span>
                                    <span className='value font-14 font-weight-600 color-icon-secondary'> {state.infra_provicder_name ? state.infra_provicder_name : 'NA'}</span>
                                </div>
                            </div>
                        </div>
                        <div className='right-part'>
                            <Link to={"/logs?global_task_id=" + task_id} target="_blank">
                                <div className='log-btn font-12 font-weight-600 color-dark-blue avtar'>
                                    view logs
                                </div>
                            </Link>
                            <Link to={"/cluster/new/onboard"}>
                                <div className='re-conf-btn font-12 font-weight-600 avtar'>
                                    Re-Configure
                                </div>
                            </Link>
                            <Link to={"/ClusterDashboard"}>
                                <div className='finish-btn font-12 font-weight-600 avtar'>
                                    Finish Setup
                                </div>
                            </Link>

                        </div>
                    </div>
                    : null} */}
                        <div className={classes.root}>
                            {!cluster_id ?
                                <div className='header'>
                                    <span className='font-16 font-weight-600 color-value'>
                                        Following Kubernetes Resource permissions will be required to enable below mentioned features.
                                    </span>
                                    <Link to={"cluster/new/onboard"}>
                                        <span className='ri-close-fill font-24' style={{ color: "#000000" }}></span>
                                    </Link>
                                </div>
                                :
                                null
                            }

                            <div className='content-body'>
                                <div className='cover width-full'>
                                    <div className="main-content" id='primary' style={sectionOpener.primary ? { height: "fit-content" } : { height: "44px" }}>
                                        <div className='d-flex align-center space-between width-full' style={{ height: "30px", cursor: "pointer" }} onClick={() => toggleSection("primary")} role='button' tabIndex={0} onKeyDown={() => { }}>
                                            <div className='d-flex space-between align-center width-full'>
                                                <div className='d-flex align-center gap-8'>
                                                    <span>Primary Features</span>
                                                    <span className='ri-star-s-fill font-18' style={{ color: "#FEA111" }}></span>
                                                    {
                                                        (Object.keys(state.permission_verbs_json).length === 0 && !defaultPermisson) ?
                                                            <span className='ri-error-warning-line font-18' style={{ color: "#FEA111" }}></span> : null
                                                    }

                                                </div>
                                                <span className='ri-arrow-down-s-line font-20 color-icon-secondary' style={sectionOpener.primary ? { transform: "rotate(180deg)" } : {}}></span>
                                            </div>
                                        </div>

                                        <div className='feature-table width-full' style={sectionOpener.primary ? { height: "fit-content" } : { height: "0", display: "none" }}>
                                            <div className='table-header'>
                                                <span>Feature</span>
                                                <div style={{ display: "grid", gridTemplateColumns: "40% 60%" }}>
                                                    <span >Resources</span>
                                                    <span>Required Verbs</span>
                                                </div>
                                            </div>
                                            {
                                                primaryFeature.map((ele, index) => (
                                                    <div className='table-body' key={index}>
                                                        <div className='feature-resource'>
                                                            <span className='font-12 font-weight-600 text-color-black' style={{ padding: "12px" }}>{ele.label}</span>
                                                        </div>
                                                        <div className='feature-resource d-flex f-direction-column'>
                                                            {ele.resources.map((resource, key) => (
                                                                <div style={{ display: "grid", gridTemplateColumns: "40% 60%" }}>
                                                                    <span className='font-12 font-weight-500 color-icon-secondary main-resources'
                                                                        key={key} style={{ borderBottom: ele.resources.length - 1 > key ? "1px solid #E6E6E6" : "none", borderRight: "1px solid #E6E6E6" }}>{resource}</span>
                                                                    <div className='required-verb'>
                                                                        {Object.keys(ele.permissions).map((perm, pos) => (
                                                                            <div className='d-flex space-between'>
                                                                                <div className='d-flex space-between align-center width-full gap-8'>
                                                                                    <span className='font-12 color-value text-capatalize'>
                                                                                        <span className={getPermissionIcon(perm.toString()) + " font-16 mr-6"}></span>
                                                                                        {perm}{ele.permissions[perm] ? <span className='color-asterisk'>*</span> : null}</span>
                                                                                    {
                                                                                        defaultPermisson ?
                                                                                            <>
                                                                                                {/* <span className='ri-checkbox-circle-line font-16 color-check-green'></span> */}

                                                                                            </>
                                                                                            :
                                                                                            <>
                                                                                                {/* {state.permission_verbs_json[ele.resourcesKey] && (state.permission_verbs_json[ele.resourcesKey]?.includes(perm)) ? <span className='ri-checkbox-circle-line font-16 color-check-green'></span> :
                                                                                                    <span className='ri-close-circle-line font-16 color-asterisk'></span>} */}
                                                                                            </>
                                                                                    }
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                    <div className="main-content" id='metric' style={sectionOpener.metric ? { height: "fit-content" } : { height: "44px" }}>
                                        <div className='d-flex align-center space-between width-full' style={{ height: "30px", cursor: "pointer" }} onClick={() => toggleSection("metric")} role='button' tabIndex={0} onKeyDown={() => { }}>
                                            <div className='d-flex space-between align-center width-full'>
                                                <div className='d-flex align-center' style={{ gap: "8px" }}>
                                                    <span>Metric Server</span>
                                                    <span className='ri-star-s-fill font-18' style={{ color: "#FEA111" }}></span>
                                                    {
                                                        (!state.permission_verbs_json["MetricServerAPI"] || (state.permission_verbs_json["MetricServerAPI"]?.pods?.length === 0 && state.permission_verbs_json["MetricServerAPI"]?.nodes?.length === 0)) ?
                                                            <span className='ri-error-warning-line font-18' style={{ color: "#FEA111" }}></span> : null
                                                    }
                                                    {(!state.permission_verbs_json["MetricServerAPI"] || (state.permission_verbs_json["MetricServerAPI"]?.pods?.length === 0 && state.permission_verbs_json["MetricServerAPI"]?.nodes?.length === 0)) && <div className='d-flex align-center gap-8'>
                                                        <button className='notconfigurebtn'>
                                                            <span className='ri-error-warning-line font-18' style={{ color: "#FEA111" }}></span>
                                                            <div className='font-11 font-weight-bold text-uppercase' style={{ color: '#E1941D', whiteSpace: "nowrap" }}>Not Configured</div>
                                                        </button>
                                                        <button className='setupematricserverbtn' onClick={handleOpenDialog}>
                                                            <span>Setup Metric Server</span>
                                                        </button>
                                                    </div>}
                                                </div>

                                                <span className='ri-arrow-down-s-line font-20 color-icon-secondary' style={sectionOpener.metric ? { transform: "rotate(180deg)" } : {}}></span>
                                            </div>
                                        </div>

                                        <div className='feature-table width-full' style={sectionOpener.metric ? { height: "fit-content" } : { height: "0", display: "none" }}>
                                            <div className='table-header'>
                                                <span>Feature</span>
                                                <div style={{ display: "grid", gridTemplateColumns: "40% 60%" }}>
                                                    <span >Resources</span>
                                                    <span>Required Verbs</span>
                                                </div>
                                            </div>
                                            {
                                                getObjectArray(metricFeature).map((ele, index) => (
                                                    <div className='table-body' key={index}>
                                                        <div className='feature-resource'>
                                                            <span className='font-12 font-weight-600 text-color-black' style={{ padding: "12px" }}>{ele.label}</span>
                                                        </div>
                                                        <div className='feature-resource d-flex f-direction-column'>
                                                            {ele.resources.map((resource, key) => (
                                                                <div style={{ display: "grid", gridTemplateColumns: "40% 60%" }}>
                                                                    <span className='font-12 font-weight-500 color-icon-secondary main-resources'
                                                                        key={key} style={{ borderBottom: ele.resources.length - 1 > key ? "1px solid #E6E6E6" : "none", borderRight: "1px solid #E6E6E6" }}>{resource}</span>
                                                                    <div className='required-verb'>
                                                                        {Object.keys(ele.permissions).map((perm, pos) => (
                                                                            <div className='d-flex space-between'>
                                                                                <div className='d-flex space-between align-center width-full gap-8' style={{ gap: "8px" }}>
                                                                                    <span className='font-12 color-value text-capatalize'>
                                                                                        <span className={getPermissionIcon(perm.toString()) + " font-16 mr-6"}></span>
                                                                                        {perm}{ele.permissions[perm] ? <span className='color-asterisk'>*</span> : null}</span>
                                                                                    {

                                                                                        defaultPermisson ?
                                                                                            <>
                                                                                                {/* <span className='ri-checkbox-circle-line font-16 color-check-green'></span> */}

                                                                                            </>
                                                                                            :

                                                                                            <>
                                                                                                {/* {state.permission_verbs_json["MetricServerAPI"] && state?.permission_verbs_json["MetricServerAPI"][returnKey(ele.resourcesKey).next().value] && (state?.permission_verbs_json["MetricServerAPI"][returnKey(ele.resourcesKey).next().value]?.includes(perm)) ? <span className='ri-checkbox-circle-line font-16 color-check-green'></span> :
                                                                                                    <span className='ri-close-circle-line font-16 color-asterisk'></span>} */}
                                                                                            </>
                                                                                    }

                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                    <div className="main-content" id='dashboard' style={sectionOpener.dashboard ? { height: "fit-content" } : { height: "44px" }} >
                                        <div className='d-flex align-center space-between width-full' style={{ height: "30px", cursor: "pointer" }} onClick={() => toggleSection("dashboard")} role='button' tabIndex={0} onKeyDown={() => { }}>
                                            <div className='d-flex space-between align-center width-full'>
                                                <div className='d-flex align-center gap-8'>
                                                    <span>Dashboard Features</span>
                                                    {
                                                        (Object.keys(state.permission_verbs_json).length === 0 && !defaultPermisson) ?
                                                            <span className='ri-error-warning-line font-18' style={{ color: "#FEA111" }}></span> : null
                                                    }
                                                </div>
                                                <span className='ri-arrow-down-s-line font-20 color-icon-secondary' style={sectionOpener.dashboard ? { transform: "rotate(180deg)" } : {}}></span>
                                            </div>
                                        </div>

                                        <div className='feature-table width-full' style={sectionOpener.dashboard ? { height: "fit-content" } : { height: "0", display: "none" }}>
                                            <div className='table-header'>
                                                <span>Feature</span>
                                                <div style={{ display: "grid", gridTemplateColumns: "40% 60%" }}>
                                                    <span>Resources</span>
                                                    <span>Required Verbs</span>
                                                </div>
                                            </div>
                                            {
                                                dashboardFeature.map((ele, index) => (
                                                    <div className='table-body' key={index}>
                                                        <div className='feature-resource'>
                                                            <span style={{ padding: "12px" }} className='font-12 font-weight-600 text-color-black'>{ele.label}</span>
                                                        </div>
                                                        <div className='feature-resource d-flex f-direction-column'>
                                                            {ele.resources.map((resource, key) => (
                                                                <div style={{ display: "grid", gridTemplateColumns: "40% 60%" }}>
                                                                    <span className='font-12 font-weight-500 color-icon-secondary main-resources'
                                                                        key={key} style={{ borderBottom: ele.resources.length - 1 > key ? "1px solid #E6E6E6" : "none", borderRight: "1px solid #E6E6E6" }}>{resource}</span>
                                                                    <div className='required-verb'>
                                                                        {Object.keys(ele.permissions).map((perm, pos) => (
                                                                            <div className='d-flex space-between'>
                                                                                <div className='d-flex space-between align-base width-full gap-8'>
                                                                                    <span className='font-12 color-value text-capatalize'><span className={getPermissionIcon(perm.toString()) + " font-16 mr-6"}></span>{perm}{ele.permissions[perm] ? <span className='color-asterisk'>*</span> : null}</span>
                                                                                    {
                                                                                        defaultPermisson ?
                                                                                            <>
                                                                                                {/* <span className='ri-checkbox-circle-line font-16 color-check-green'></span> */}

                                                                                            </> :
                                                                                            <>
                                                                                                {/* {state.permission_verbs_json[returnKey(ele.resourcesKey).next().value] && (state.permission_verbs_json[returnKey(ele.resourcesKey).next().value]?.includes(perm)) ? <span className='ri-checkbox-circle-line font-16 color-check-green'></span> :
                                                                                                    <span className='ri-close-circle-line font-16 color-asterisk'></span>
                                                                                                } */}
                                                                                            </>
                                                                                    }
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                    <div className="main-content" id='other' style={sectionOpener.other ? { height: "fit-content" } : { height: "44px" }}>
                                        <div className='d-flex align-center space-between width-full' style={{ height: "30px", cursor: "pointer" }} onClick={() => toggleSection("other")} role='button' tabIndex={0} onKeyDown={() => { }}>
                                            <div className='d-flex space-between align-center width-full'>
                                                <div className='d-flex align-center gap-8'>
                                                    <span>Other Features</span>
                                                    {
                                                        (Object.keys(state.permission_verbs_json).length === 0 && !defaultPermisson) ?
                                                            <span className='ri-error-warning-line font-18' style={{ color: "#FEA111" }}></span> : null
                                                    }
                                                </div>
                                                <span className='ri-arrow-down-s-line font-20 color-icon-secondary' style={sectionOpener.other ? { transform: "rotate(180deg)" } : {}}></span>
                                            </div>
                                        </div>

                                        <div className='feature-table width-full' style={sectionOpener.other ? { height: "fit-content" } : { height: "0", display: "none" }}>
                                            <div className='table-header'>
                                                <span>Feature</span>
                                                <div style={{ display: "grid", gridTemplateColumns: "40% 60%" }}>
                                                    <span>Resources</span>
                                                    <span>Required Verbs</span>
                                                </div>
                                            </div>
                                            {
                                                otherFeature.map((ele, index) => (
                                                    <div className='table-body' key={index}>
                                                        <div className='feature-resource'>
                                                            <span className='font-12 font-weight-600 text-color-black' style={{ padding: "12px" }}>{ele.label}</span>
                                                        </div>
                                                        <div className='feature-resource d-flex f-direction-column'>
                                                            {ele.resources.map((resource, key) => (
                                                                <div style={{ display: "grid", gridTemplateColumns: "40% 60%" }}>
                                                                    <span className='font-12 font-weight-500 color-icon-secondary main-resources'
                                                                        key={key} style={{ borderBottom: ele.resources.length - 1 > key ? "1px solid #E6E6E6" : "none", borderRight: "1px solid #E6E6E6" }}>{resource}</span>
                                                                    <div className='required-verb'>
                                                                        {Object.keys(ele.permissions).map((perm, pos) => (
                                                                            <div className='d-flex space-between'>
                                                                                <div className='d-flex space-between align-base width-full gap-8'>
                                                                                    <span className='font-12 color-value text-capatalize'><span className={getPermissionIcon(perm.toString()) + " font-16 mr-6"}></span>{perm}{ele.permissions[perm] ? <span className='color-asterisk'>*</span> : null}</span>
                                                                                    {
                                                                                        defaultPermisson ?
                                                                                            <>
                                                                                                {/* <span className='ri-checkbox-circle-line font-16 color-check-green'></span> */}

                                                                                            </> :
                                                                                            <>
                                                                                                {/* {state.permission_verbs_json[returnKey(ele.resourcesKey).next().value] && (state.permission_verbs_json[returnKey(ele.resourcesKey).next().value]?.includes(perm)) ? <span className='ri-checkbox-circle-line font-16 color-check-green'></span> :
                                                                                                    <span className='ri-close-circle-line font-16 color-asterisk'></span>} */}
                                                                                            </>
                                                                                    }
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>

                                </div>



                            </div>

                        </div>
                        {cluster_id ?
                            <div className={classes.dynamicHeader}>
                                <div className='left-part'>

                                </div>
                                <div className='right-part'>
                                    <Link to={"/logs?global_task_id=" + task_id} target="_blank">
                                        <div className='log-btn font-12 font-weight-600 color-dark-blue avtar'>
                                            view logs
                                        </div>
                                    </Link>
                                    <Link to={"/cluster/new/onboard"}>
                                        <div className='re-conf-btn font-12 font-weight-600 avtar'>
                                            Re-Configure
                                        </div>
                                    </Link>
                                    <Link to={"/ClusterDashboard"}>
                                        <div className='finish-btn font-12 font-weight-600 avtar'>
                                            Finish Setup
                                        </div>
                                    </Link>

                                </div>
                            </div>
                            : null}

                    </div>
                    {
                        <Dialog open={openDialog}
                            className={classes.muiSetDefaultDialog}
                            onClose={handleCloseDialog}>
                            <div className={classes.setDefaultDialog}>
                                <div className='width-full align-center display-inline-flex space-between gap-8' style={{ padding: "11px 16px", background: "#fafafa" }}>
                                    <div className='d-flex align-center justify-flex-start' style={{ gap: 24, }}>
                                        <div className='font-weight-600 text-transform-uppercase word-wrap-break font-16' style={{ color: '#2F2F2F' }}>Caution</div>
                                    </div>
                                    <span className='ri-close-fill font-24 cursor-pointer' onClick={handleCloseDialog} role='button' tabIndex={0} onKeyDown={() => { }}>

                                    </span>
                                </div>
                                <div className='setdefmiddlebar d-flex align-center justify-center f-direction-column w-100'>
                                    <div className="display-flex align-center justify-center" style={{ padding: "12px", width: "56px", height: "56px", border: "1px solid #DFEDFF", background: "#F5FAFF", borderRadius: "6px" }}>

                                        <span className='ri-alert-fill' style={{ fontSize: "32px", color: "#FEA111" }}></span>
                                    </div>
                                    <div className='d-flex align-center f-direction-column mt-20' >

                                        <div>
                                            <div className='font-14 font-weight-600 word-wrap-break text-align-center mt-12 ' style={{ color: '#2F2F2F', lineHeight: "1.5", width: "384px", height: "42px", textAlign: "center" }}>Are you sure you want to setup metric server?</div>

                                        </div>
                                    </div>
                                </div>
                                <div className='setdefbottombar w-100 d-flex align-center space-between'>
                                    <div className='d-flex align-center gap-8'>

                                    </div>
                                    <div className='d-flex align-center gap-8'>
                                        <button className='display-inline-flex align-center justify-center gap-5'>
                                            <span className='font-12 font-weight-600 word-wrap-break text-transform-uppercase text-align-center' onClick={handleCloseDialog} role='button' tabIndex={0} onKeyDown={() => { }}>Cancel</span>
                                        </button>
                                        <div style={{ width: "211px", height: "40px" }}>
                                            <Button fullWidth={true} isLoading={state.setup_loading} className='display-inline-flex align-center justify-center gap-5 border-none ' style={{ height: "40px", width: "100%", background: '#0086FF', borderRadius: "6px" }} onClick={handleSetupeMatrics}>
                                                <span className='font-12 font-weight-600 word-wrap-break text-transform-uppercase  color-white'>Yes, Setup Metric server!</span>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Dialog >
                    }
                </>
            }
        </>
    )
}

export default ClusterPermissions

const useStyles = makeStyles(theme => ({
    dynamicHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        marginTop: "20px",
        '& .left-part': {
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            justifyContent: "space-between",
            alignItems: "center",
            '& .top-part': {
                display: "flex",
                alignItems: "center",
                gap: "12px",
                width: "100%",
                '& .status-chip-failed': {
                    display: "flex",
                    padding: "7px 8px",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "10px",
                    borderRadius: "6px",
                    background: "#FFEBEB",
                    color: "#C11212",
                    fontWeight: "700",
                    lineHeight: "1",
                }
            },
            '& .bottom-part': {
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
            }
        },
        '& .right-part': {
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "12px",
            flexShrink: '0',
            '& .log-btn': {
                display: "flex",
                height: "40px",
                padding: "8px 16px",
                justifyContent: "center",
                alignItems: "center",
                gap: "6px",
                borderRadius: "6px",
                border: "1px solid #9DC0EE",
                background: "#FFF",
                "&:hover": {
                    borderColor: "#0086ff",
                    background: "#0086ff",
                    color: "#FFF !important",
                    cursor: "pointer",
                }
            },
            '& .re-conf-btn': {
                display: "flex",
                height: "40px",
                padding: "11px 16px",
                justifyContent: "center",
                alignItems: "center",
                gap: "6px",
                borderRadius: "6px",
                background: "#FEA111",
                color: "#FFF",
                cursor: "pointer",
            },
            '& .finish-btn': {
                display: "flex",
                height: "40px",
                padding: "11px 16px",
                justifyContent: "center",
                alignItems: "center",
                gap: "6px",
                borderRadius: "6px",
                background: "#0086FF",
                color: "#FFF",
                cursor: "pointer",
            }
        }
    },
    root: {
        borderRadius: "6px",
        background: "#FFF",
        boxShadow: "0px 8px 24px 0px rgba(0, 0, 0, 0.04), 0px 4px 4px 0px rgba(0, 0, 0, 0.08)",
        '& .header': {
            display: "flex",
            padding: "20px 20px 0px 20px",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "24px",
            alignSelf: "stretch",
        },
        '& .content-body': {
            display: "flex",
            padding: "16px",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "56px",
            alignSelf: "stretch",
            '& .cover': {
                borderRadius: "6px",
                border: "1px solid #CACACA",
            },
            '& .main-content': {
                display: "flex",
                padding: "12px 16px",
                //justifyContent: "space-between",
                alignItems: "center",
                alignSelf: "stretch",
                background: "linear-gradient(180deg, #FFF 0%, #F5F5F5 100%)",
                // borderRadius: "6px",
                height: "fit-content",
                flexDirection: "column",

                "& .notconfigurebtn": {
                    height: "25px",
                    width: "max-content",
                    padding: "6px 12px",
                    background: '#FCF6E1',
                    borderRadius: 20,
                    border: '1px #EFE6C5 solid',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    gap: 8,
                    display: 'flex',

                    "& span": {
                        color: "#FCF6E1"
                    },
                    "&:hover": {

                    },
                },
                "& .setupematricserverbtn": {
                    width: '100%',
                    height: '25px',
                    paddingLeft: 16,
                    paddingRight: 16,
                    paddingTop: 8,
                    paddingBottom: 8,
                    background: 'white',
                    borderRadius: 6,
                    overflow: 'hidden',
                    border: '1px #9DC0EE solid',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 6,
                    display: 'inline-flex',

                    "& span": {
                        textAlign: 'center',
                        color: '#124D9B',
                        fontSize: 11,
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        wordWrap: 'break-word'
                    },

                    "&:hover": {
                        background: "#0086FF",
                    },
                    "&:hover span": {
                        color: "#FFF",

                    }
                }
            },
            '& #primary': {
                borderTopLeftRadius: "6px",
                borderTopRightRadius: "6px",
            },
            '& #other': {
                borderBottomLeftRadius: "6px",
                borderBottomRightRadius: "6px",
            },
            '& .feature-table': {
                borderRadius: "6px",
                border: "1px solid #CACACA",
                transition: "all 0.5s ease-in-out",
                '& .table-header': {
                    backgroundColor: "#FAFAFA",
                    borderTopLeftRadius: "6px",
                    borderTopRightRadius: "6px",
                    display: "grid",
                    gridTemplateColumns: "25% 75%",
                    borderBottom: "1px solid #E6E6E6",
                    '& span': {
                        display: "flex",
                        padding: "8px 12px",
                        alignItems: "flex-start",
                        alignSelf: "stretch",
                        fontSize: "12px",
                        color: "#787878",
                        borderRight: "1px solid #E6E6E6"
                    },
                    '& > div:not(:last-child)': {
                        borderRight: "1px solid #CACACA",
                    },
                },
                '& .table-body': {
                    backgroundColor: "#FFF",
                    borderBottomLeftRadius: "6px",
                    borderBottomRightRadius: "6px",
                    display: "grid",
                    // gridTemplateColumns: "25% 37.5% 37.5%",
                    gridTemplateColumns: "25% 75%",
                    borderBottom: "1px solid #CACACA",
                    '& .feature-resource span': {
                        display: "flex",
                        alignItems: "center",
                        flexShrink: 0,
                        alignSelf: "stretch",
                    },
                    "& .feature-resource .main-resources": {
                        padding: "12px"
                    },
                    "& .required-verb": {
                        gap: 10,
                        display: "flex",
                        alignItems: "center",
                        padding: "12px",
                        flexWrap: "wrap",
                        borderBottom: "1px solid #E6E6E6"
                    },
                    '& .required-verb>div': {
                        height: "28px",
                        width: "max-content",
                        display: "flex",
                        padding: "6px 6px 6px 12px",
                        alignItems: "center",
                        gap: 8,
                        borderRadius: 20,
                        border: "1px solid #F4F4F4",
                        background: "#FAFAFA",


                    },
                    '& > div:not(:last-child)': {
                        borderRight: "1px solid #CACACA",
                    },
                }
            }
        }
    },
    muiSetDefaultDialog: {
        "& .MuiDialog-paperScrollPaper": {
            width: "inherit",
        },
        "& .MuiDialog-paper": {
            overflow: "hidden"
        },
        "& .MuiDialog-paperWidthSm": {
            maxWidth: "655px"
        },
    },
    setDefaultDialog: {
        width: "655px",
        height: "330px",

        "& .setdefmiddlebar": {
            padding: "24px 16px",
            height: "200px"


        },

        "& .setdefbottombar": {
            height: "75",
            padding: "16px",
            background: "rgb(250, 250, 250)",

            "& button": {
                "&:nth-child(1)": {
                    background: "white",
                    height: "40px",
                    width: "84px",
                    borderRadius: "6px",
                    border: "1px solid #9DC0EE",
                    color: '#124D9B',
                    "&:hover": {
                        background: "#0086FF",
                        color: "#FFF !important"
                    }
                },
                "&:nth-child(2)": {
                    "&:hover": {
                        background: "#03234D !important"
                    }
                }
            }
        }
    },
}))


