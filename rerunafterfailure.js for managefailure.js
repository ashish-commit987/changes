import React, { useState } from 'react'
import PropTypes from 'prop-types';
import Dialog from '@mui/material/Dialog';

import { Tooltip } from "@mui/material/";
import { makeStyles } from '@mui/styles';
import { Loading } from '../../../utils/Loading';
import { Input } from '../../../../components/genericComponents/Input';
import { ExandableComponentList } from '../../../../components/hoc/expandableList';
const RerunAfterFailure = (props) => {
    const data = props.data;

    const pipeline = props.pipeline;
    const last_trigger = pipeline && pipeline.last_trigger ? pipeline.last_trigger : null;
    const pipeline_context_param = last_trigger && last_trigger.pipeline_context_param ? last_trigger.pipeline_context_param : null
    console.log("Fdsadfsafsa", data, pipeline)
    const classes = useStyles();
    const variant = props.variant ? props.variant : null;
    const [fullWidth, setFullWidth] = useState(true);
    const [maxWidth, setMaxWidth] = useState('md');

    let service_list_canary = [];
    var expandable_component = null;
    const iteration_count = 3;

    if (data && data.length > 0) {
        data.forEach((item, key) => {
            if (item.status === "DONT_RUN" && item.manage_failure_json === null) {
                console.log(item, "avcgdsavhcgdv")
                service_list_canary.push(
                    <Tooltip title={item ? item.service_name : "N/A"}>
                        <div className={"chip-sq-canary chip-sq-primary-outline"} key={item ? item.service_name : "N/A"}>
                            {item ? item.service_name : "N/A"}
                        </div>
                    </Tooltip>
                )
            }
        })
        expandable_component = (
            <>
                +{data && data.length > 0 ? data.length - iteration_count : null}
            </>
        );
    }

    console.log(service_list_canary, "svcgdsvcgsvdg")

    const [state, setstate] = useState({
        data: {},
        error: {},
        loading: false,
        isPipelineRerunable: false

    })
    const rerunJob = props.rerunJob
    const validateAndSendData = () => {
        var post_data = state.data;
        rerunJob(post_data);
        handleClose()
    }

    const handleClickOpen = () => {
        setstate({ ...state, open: true });

    };

    const handleClose = () => {
        setstate({ ...state, open: false, });
    };
    const onKeyValueChangeHandler = (key, value) => {
        value.forEach((id, index) => {
            value[index] = id;
        });

        setstate({
            ...state,
            data: {
                ...state.data,
                [key]: value
            },
            error: {
                ...state.error,
                [key]: null,
            }
        });
    };


    const buttonLabel = props.buttonLabel || "Re-run Job";

    return (
        <>
            {
                pipeline && pipeline.last_trigger ?
                    <button className={`${classes.rerunMsgBtn} btn btn-primary-v2`} onClick={handleClickOpen} >
                        {buttonLabel}
                    </button>
                    :
                    pipeline && pipeline.last_trigger && service_list_canary.length == 0 ?
                        <Tooltip title="There are no other services in this pipeline or for which canary deployment is not running">
                            <button className="btn btn-primary-v2 mr-3 btn-disable" >
                                {buttonLabel}
                            </button>
                        </Tooltip>
                        :
                        <></>
            }
            <Dialog
                open={state.open}
                onClose={handleClose}
                fullWidth={fullWidth}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <div className="fill-details-head d-flex align-center space-between "
                    style={{ backgroundColor: 'rgb(18, 77, 155)', padding: 14 }}>
                    <p className='color-white'>Rerun Failed Job</p>
                    <button className="btn btn-transparent" color="inherit" onClick={handleClose} aria-label="close">
                        <span className='ri-close-line color-white' fontSize="large"></span>
                    </button>
                </div>
                <div className="card " style={{ border: 'none' }}>
                    {
                        state.loading ?
                            <div className='d-flex align-center justify-center' style={{ height: '280px' }}>
                                <Loading varient="light" />
                            </div>
                            :
                            data[0].task_type === "DEPLOY" && data[0].status == "DONT_RUN" ?
                                <>
                                    <div className="card-body" style={{ margin: "20px" }}>
                                        <div className="">
                                            <div className='' style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                                <div className='' style={{ display: "flex", alignItems: "center", borderRadius: "8px", padding: "12px 18px", backgroundColor: "#0086FF14" }}><span className='ri-refresh-line' style={{ fontSize: "32px", color: "#0086FF" }}></span></div>
                                                <div>
                                                    <p style={{ color: "#2F2F2F", fontWeight: "600", fontSize: "16px" }}>Re-run Job</p>
                                                    <p style={{ color: "#505050", fontWeight: "500", fontSize: "14px" }}>You are about to Re-Run canary for all services. Please ensure that canary deployment is not already running for following services.</p>
                                                </div>
                                            </div>
                                            <div className="" style={{ border: "1px solid ##E6E6E6", borderRadius: "6px", marginTop: "20px" }}>
                                                <div style={{ borderBottom: "1px solid #E6E6E6", padding: "16px", fontWeight: "600", fontSize: "14px" }}>
                                                    Please choose the services for which you'd like to re-run canary
                                                </div>
                                                {/* <div style={{ padding: "16px", display: "flex", gap: "8px" }}>
                                                    <ExandableComponentList compoenent_list={service_list_canary} iteration_count={3} expandable_component={expandable_component} variant={"canary-failure-services"} newStyle={""} />
                                                </div> */}
                                                <div className=''>
                                                    <Input
                                                        type={"checkbox"}
                                                        name={"components"}
                                                        label={"Services"}
                                                        list={data.map(item => {
                                                            return { label: item.service_name, id: item.service_name }
                                                        })}
                                                        data={state.data}
                                                        error={state.error}
                                                        onChangeHandler={onKeyValueChangeHandler}
                                                    />
                                                </div>
                                            </div>

                                        </div>


                                    </div>
                                    <div className="card-footer border-top pd-10 justify-end d-flex align-center" style={{ gap: "10px" }}>
                                        <button className="btn btn-outline-dark-grey mr-5" onClick={handleClose}>
                                            Cancel
                                        </button>

                                        <button className="btn btn-primary-v2" onClick={validateAndSendData}>
                                            Confirm
                                        </button>


                                    </div>
                                </>
                                :
                                <>
                                    <div className="card-body" style={{}}>
                                        <div className="m-auto" style={{ width: '400px' }}>
                                            <i className="ri-information-line text-center mb-10 d-block m-auto" style={{ color: '#4783dc', fontSize: '60px' }} />
                                            <div className="">

                                                <p className="font-16 font-weight-600  text-center mb-5">
                                                    You are about to rerun failed job in the pipeline.
                                                </p>
                                                {
                                                    data && data[0] &&
                                                        data[0].task_type && data[0].task_type === "BUILD" || data[0].task_type && data[0].task_type === "DEPLOY" || data[0].task_type && data[0].task_type === "PROMOTE" ||
                                                        data[0].task_type && data[0].task_type === "GLOBAL_BUILD" || data[0].task_type && data[0].task_type === "GLOBAL_DEPLOY" || data[0].task_type && data[0].task_type === "GLOBAL_PROMOTE" ?
                                                        <div className=''>
                                                            <p className='font-13'>Please choose the services for which you'd like to re-run the job</p>
                                                            <Input
                                                                type={"checkbox"}
                                                                name={"components"}
                                                                label={"Services"}
                                                                list={data.map(item => {
                                                                    return { label: item.service_name, id: item.service_name }
                                                                })}
                                                                data={state.data}
                                                                error={state.error}
                                                                onChangeHandler={onKeyValueChangeHandler}
                                                            />
                                                        </div>
                                                        : null
                                                }
                                            </div>

                                        </div>


                                    </div>
                                    <div className="card-footer border-top pd-10 justify-end d-flex align-center">
                                        <button className="btn btn-outline-dark-grey mr-5" onClick={handleClose}>
                                            Cancel
                                        </button>

                                        <button className="btn btn-primary-v2" onClick={validateAndSendData}>
                                            Confirm
                                        </button>


                                    </div>
                                </>
                    }

                </div>
            </Dialog>
        </>
    )
}

RerunAfterFailure.propTypes = {
    ...PropTypes.objectOf(PropTypes.any),
}

export default RerunAfterFailure;

const useStyles = makeStyles((theme) => ({
    stageData: {
        display: "flex",
        alignItems: "center",
        lineHeight: 1.5,
        "& .main-text": {
            color: "#000",
            fontSize: "13px",
            marginRight: "0px",
        },
        "& .sub-text": {
            color: "#949494",
            fontSize: "13px",
        },
        "& .status-font": {
            fontSize: "14px",
            textTransform: "uppercase",
        },
        "& .success": {
            color: "#62E187",
        },
        "& .success .flaticon-circle-with-check-symbol": {
            margin: "0px 4px",
            color: "#62E187",
        },
        "& .success .flaticon-circle-with-check-symbol:before": {
            fontSize: "14px!important",
            color: "#62E187",
        },
    },
    executionData: {
        display: "flex",
        alignItems: "center",
        lineHeight: 1,
        "& .main-text": {
            color: "#000",
            fontSize: "12px",
            marginRight: "0px",
        },
        "& .sub-text": {
            color: "#949494",
            fontSize: "12px",
        },
    },
    d_Flex: {
        display: "flex",
        alignItems: "center",
    },
    rerunMsgBtn: {
        backgroundColor: "#0086FF !important",
        borderColor: "#0086FF !important",
        textShadow: "0px 2px 1px rgba(0, 0, 0, 0.25)",
    }

}));

