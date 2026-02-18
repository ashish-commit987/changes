import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    IconButton,
    Slide,
    Tooltip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import Button from "../../components/genericComponents/Button";
import GenerateURL from "../../util/APIUrlProvider";
import InvokeApi from "../../util/apiInvoker";
import properties from "../../properties/properties";
import OllyAccordion from "./components/OllyAccordion";

import GenericSkeleton from "../../components/genericComponents/Skeletons/GenericSkeleton";
import AlertStrip from "../../components/AlertStrips";
import { showErrorHandlerUpdated } from "../../util/util";
import sampleData from "./components/sampleData";
import { useCustomSnackbar } from "../../contexts/SnackbarContext";

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="left" ref={ref} {...props} />;
});

const BpOllyDialog = ({ pipeline_id, pipeline_instance_id, data = [], autoOpenOnFailure = true, open, onClose: propsOnClose, hideButton, onManageFailure }) => {
    const navigate = useNavigate();
    const { showSnackbar } = useCustomSnackbar();

    const [state, setState] = useState({
        show_loading_icon: false,
        data_load_failure: false,
        error_in_loading_data: null,
        response_data: null,
        analyze_loading: false,
    });

    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined;
    const showOllyDialog = isControlled ? open : internalOpen;

    const handleToggle = () => {
        if (!isControlled) {
            setInternalOpen(true);
        }
    };

    const onClose = () => {
        if (isControlled && propsOnClose) {
            propsOnClose();
        } else {
            setInternalOpen(false);
        }
    };

    const stage_instance = data && data.length > 0 ? data : [];
    const failed_stage_instance = stage_instance[stage_instance.length - 1];

    const trigger_id =
        failed_stage_instance?.trigger_id ||
        failed_stage_instance?.id ||
        failed_stage_instance?.instance_id;

    useEffect(() => {
        if (showOllyDialog) {
            fetchRCA();
        }
    }, [showOllyDialog]);

    useEffect(() => {
        if (failed_stage_instance && failed_stage_instance.status == "FAILED" && autoOpenOnFailure && !isControlled) {
            setInternalOpen(true);
        }
    }, [failed_stage_instance && failed_stage_instance.status == "FAILED", autoOpenOnFailure]);

    /**
     * Fetches RCA (Root Cause Analysis) data for the failed pipeline
     */
    function fetchRCA() {
        var requestInfo = {
            endPoint: GenerateURL(
                {
                    pipeline_id: pipeline_id,
                    pipeline_instance_id: pipeline_instance_id,
                },
                properties.api.bp_olly,
            ),
            httpMethod: "GET",
            httpHeaders: { "Content-Type": "application/json" },
        };
        InvokeApi(requestInfo, handleSuccessApiHit, handleFailedApiHit);
        setState((new_state) => ({
            ...new_state,
            show_loading_icon: true,
            data_load_failure: false,
            error_in_loading_data: null,
        }));
    }

    const handleSuccessApiHit = (response) => {
        console.log(response, "RCA Response");
        setState((new_state) => ({
            ...new_state,
            show_loading_icon: false,
            data_load_failure: false,
            error_in_loading_data: null,
            response_data: response,
        }));
    };

    const handleFailedApiHit = (error) => {
        console.log(error, "RCA Error");
        let error_msg = showErrorHandlerUpdated(error);

        showSnackbar("error", "Failed to Load Analysis", error_msg);

        setState((new_state) => ({
            ...new_state,
            show_loading_icon: false,
            data_load_failure: true,
            error_in_loading_data: error_msg,
        }));
    };

    function mockFunction() {
        const prompt = "list all the avialable tools";
        setTimeout(() => {
            navigate(`/bp-olly?prompt=${encodeURIComponent(prompt)}&auto_send=true`);
        }, 500);
    }
    function handleAnalyzeFailure() {
        try {
            if (!trigger_id) {
                const msg = "Trigger ID is not available. Cannot analyze failure.";

                showSnackbar("error", "Analysis Failed", msg);

                setState((prev) => ({
                    ...prev,
                    data_load_failure: true,
                    error_in_loading_data: msg,
                }));
                return;
            }

            setState((prev) => ({
                ...prev,
                analyze_loading: true,
                data_load_failure: false,
                error_in_loading_data: null,
            }));

            const requestInfo = {
                endPoint: GenerateURL(
                    {
                        pipeline_id: pipeline_id,
                        trigger_id: trigger_id,
                    },
                    properties.api.analyse_failure,
                ),
                httpMethod: "GET",
                httpHeaders: { "Content-Type": "application/json" },
            };

            InvokeApi(
                requestInfo,
                handleAnalyzeFailureSuccess,
                handleAnalyzeFailureError,
            );
        } catch (err) {
            console.error("JS Error:", err);

            showSnackbar("error", "Analysis Failed", "Something went wrong.");

            setState((prev) => ({
                ...prev,
                analyze_loading: false,
            }));
        }
    }

    function handleAnalyzeFailureSuccess(response) {
        console.log("Analyze Failure API Response:", response);

        const prompt =
            response?.prompt ||
            response?.message ||
            response?.analysis_prompt ||
            JSON.stringify(response);

        setState((prev) => ({
            ...prev,
            analyze_loading: false,
        }));

        showSnackbar("success", "Success", "Redirecting to Olly Chat...");

        setShowOllyDialog(false);

        navigate(`/bp-olly?prompt=${encodeURIComponent(prompt)}&auto_send=true`);
    }

    function handleAnalyzeFailureError(error) {
        console.error("API Error:", error);

        let error_msg = "Unable to fetch analysis data. Please try again.";

        showSnackbar("error", "Analysis Failed", error_msg);

        setState((prev) => ({
            ...prev,
            analyze_loading: false,
            data_load_failure: true,
            error_in_loading_data: error_msg,
        }));
    }

    return (
        <>
            {failed_stage_instance && failed_stage_instance.status == "FAILED" && !hideButton && (
                <Button
                    variant="olly"
                    style={{ padding: "8px 11px" }}
                    onClick={handleToggle}
                ></Button>
            )}

            <Dialog
                open={showOllyDialog}
                onClose={onClose}
                TransitionComponent={Transition}
                keepMounted
                hideBackdrop
                PaperProps={{
                    sx: {
                        position: "fixed",
                        right: 0,
                        margin: 0,
                        maxWidth: "410px",
                        width: "100%",
                        height: "100%",
                        borderRadius: 0,
                        boxShadow: 6,
                        maxHeight: "100%",
                        overflow: "visible"
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        bgcolor: '#905CC8',
                        color: 'white',
                        position: 'relative',
                        fontWeight: 600,
                        px: '16px',
                        py: '11px',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    <img src="/images/bp-olly/bp-olly-white.svg" alt=".." style={{ marginRight: '16px' }} />
                    <span className='font-18 color-white font-weight-600' style={{ lineHeight: 'normal' }}>BP Log Analyzer</span>
                    <Tooltip
                        title="Available only for v2 jobs."
                        arrow
                    >
                        <Box
                            className='d-flex align-center justify-center'
                            sx={{
                                padding: '4px 4px',
                                color: '#ffffff',
                                backgroundColor: '#0086ff',
                                borderRadius: '4px',
                                marginLeft: '6px',
                                cursor: 'pointer',
                                "& span": {
                                    lineHeight: '100%'
                                }
                            }}
                        >
                            <span className='font-14 font-weight-600 text-transform-uppercase'>Beta</span>
                            <span className='ri-information-line font-15 ml-4 font-weight-400'></span>
                        </Box>
                    </Tooltip>
                    <IconButton
                        aria-label="close"
                        onClick={onClose}
                        sx={{ position: 'absolute', right: 452, top: 0 }}
                    >
                        <button className='btn float-cancel-button' ><span className='ri-close-line'></span></button>
                    </IconButton>
                </DialogTitle>

                <DialogContent className="" sx={{ padding: "20px !important" }}>
                    {state?.show_loading_icon ? (
                        <>
                            {Array.from({ length: 6 }).map((_, index) => {
                                return (
                                    <GenericSkeleton
                                        height={62}
                                        style={{ borderRadius: "8px" }}
                                        rootStyle={{ marginBottom: "8px" }}
                                        key={index}
                                    />
                                );
                            })}
                        </>
                    ) : state?.data_load_failure ? (
                        <AlertStrip
                            message={state?.error_in_loading_data}
                            variant={"error"}
                        />
                    ) : (
                        state?.response_data &&
                        Object.entries(state.response_data).map(
                            ([microservice, entries], idx) => (
                                <OllyAccordion
                                    key={idx}
                                    microservice={microservice}
                                    data={entries[0]}
                                />
                            ),
                        )
                    )}
                </DialogContent>

                <div style={{ padding: "0px 20px 20px" }}>
                    <Box textAlign="center" sx={{ bgcolor: "#fafafa", padding: "12px", display: "flex", gap: "12px" }}>
                        {/* Analyze Failure Button - Redirects to BP-Olly Chat */}

                        <Button
                            variant="outline"
                            className=""
                            style={{ width: "100%", flex: 1 }}
                            startIcon={"ri-message-3-line font-20"}
                            // onClick={handleAnalyzeFailure}
                            onClick={mockFunction}
                            disabled={state?.analyze_loading || !trigger_id}
                        >
                            {state?.analyze_loading ? "Loading..." : "Analyse Failure"}
                        </Button>
                        <Button
                            variant="outline"
                            className=""
                            style={{ width: "100%", flex: 1, backgroundColor: "#EA4335", fontWeight: "600", color: "white" }}
                            onClick={() => {
                                if (onManageFailure) onManageFailure();
                                onClose();
                            }}
                        >
                            Manage Failure
                        </Button>

                        {/* <Tooltip title="This feature is coming soon">
              <Button
                variant="outline"
                className=""
                style={{
                  width: "100%",
                  cursor: "not-allowed",
                  marginTop: "12px",
                }}
                startIcon={"ri-message-3-line font-20"}
                disabled
              >
                CONTACT BUILDPIPER TEAM
              </Button>
            </Tooltip> */}
                    </Box>
                </div>
            </Dialog>
        </>
    );
};

export default BpOllyDialog;
