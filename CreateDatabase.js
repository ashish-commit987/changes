import React, { useEffect, useState } from 'react'
import { styled } from "@mui/system";
import Grid from '@mui/material/Grid';
import CommonHorizontalTab from '../../../../components/genericComponents/CommonHorizontalTab'
import { Input } from '../../../../components/genericComponents/Input'
import { StyledRadio } from '../../../releasePackage/add/manualAdd/components/StylesRadio'
import { CustomLabel } from '../../../releasePackage/add/manualAdd/components/ConfigureChangeSet'
import { getCommonFunctions } from '../../../serviceRevamp/add/ci_flow/SourceDetails'
import { error } from 'highcharts'
import AddReplicaDbDialog from './AddReplicaDbDialog'
import properties from '../../../../properties/properties'
import { useDatabaseManagementContext } from './databaseContext/DatabseManagementContext'
import InvokeApi, { PostData } from '../../../../util/apiInvoker'
import GenerateURL from '../../../../util/APIUrlProvider'
import { VALIDATION_TYPE_REQUIRED } from '../../../../util/Validator'
import { Loading } from '../../../utils/Loading'
import AlertStrip from '../../../../components/AlertStrips'

const CreateMasterDatabase = (props) => {
    const inherits = props.inherits ? props.inherits : null;
    const prev_state = props.prev_state;
    const [state, setState] = useState({
        selectedDatabaseTab: 1,
        data: {
            change_set_type: "URL",
            database_end_point_type: 1000,
            is_connected: null
        },
        option_list: [{ label: 'Yes', value: "true" }, { label: 'No', value: "false" }],
        error: {},
        open: false,
        test_connection: false,
        validations: {
            name: [],
            url: [],
            credential: [],
            validation_failed: [],
            is_connected: []
        },
    })
    const commonFunctions = getCommonFunctions(state, setState, inherits);
    const { database_type, database_deployment_strategy, setCredentialList } = useDatabaseManagementContext();

    console.log(prev_state, "fyrfjtrcdtrcdjcd")

    useEffect(() => {
        if (prev_state) {
            setState((new_state) => ({
                ...new_state,
                ...prev_state,
                selectedDatabaseTab: 1,
                option_list: [{ label: 'Yes', value: "true" }, { label: 'No', value: "false" }],
                error: {},
                validations: {
                    name: [],
                    url: [],
                    credential: [],
                    validation_failed: [],
                    is_connected: []
                },
            }))
        }
    }, [prev_state])

    useEffect(() => {
        fetchCredentials()
    }, [])

    useEffect(() => {
        if (state.data.database_end_point_type == 2000) {
            setState((new_state) => ({
                ...new_state,
                validations: {
                    name: [],
                    host: [],
                    port: [],
                    credential: [],
                    validation_failed: [],
                    is_connected: []
                }
            }))
        } else {
            setState((new_state) => ({
                ...new_state,
                validations: {
                    name: [],
                    url: [],
                    credential: [],
                    validation_failed: [],
                    is_connected: []
                }
            }))
        }
    }, [state.data.database_end_point_type])

    const optionList = [
        { label: 'URL', value: 1000, info: 'You need to specify Database URL string if you select this option' },
        { label: 'Host & Port', value: 2000, info: 'You need to specify Database Host name and Port Number if you select this option' }
    ]

    function handleConnectionTest() {
        let url_temp = GenerateURL({}, properties.api.test_db_connection);
        let post_data = {
            "database_deployment_type": {
                "database_type": Number(database_type),
                "database_deployment_strategy": database_deployment_strategy
            },
            "database_type": Number(database_type),
            "database_end_point_type": Number(state.data.database_end_point_type),
            "credential": state.data.credential,
            "name": state.data.name
        }
        if (state.data.database_end_point_type == 1000) {
            post_data = {
                ...post_data,
                "url": state.data.url
            }
        }
        if (state.data.database_end_point_type == 2000) {
            post_data = {
                ...post_data,
                "host": state.data.host,
                "port": state.data.port,
            }
        }
        console.log(post_data, "avsdcgvagcvadgc")
        setState(new_state => ({
            ...new_state,
            test_loader: true,
            validations: {
                ...new_state.validations,
                validation_failed: []
            },
        }));

        PostData(url_temp, post_data, handleSuccessTestConnection, handleFailedTestConnection);
        setState(new_state => ({
            ...new_state,
            test_loader: true,
        }));
    }

    function handleSuccessTestConnection(response) {
        console.log(response, "akdvcghvsdgcvsdhcvsd")
        setState((new_state) => ({
            ...new_state,
            test_loader: false,
            test_connection: true,
            data: {
                ...new_state.data,
                is_connected: true,
            },
            validations: {
                ...new_state.validations,
                validation_failed: []
            },
        }))
    }

    function handleFailedTestConnection(error) {
        console.log(error, "akdvcghvsdgcvsdhcvsd")
        setState((new_state) => ({
            ...new_state,
            test_connection: true,
            data: {
                ...new_state.data,
                is_connected: false,
            },
            validations: {
                ...new_state.validations,
                validation_failed: [VALIDATION_TYPE_REQUIRED]
            },
            test_loader: false,
            error_msg: error.details
        }))
    }

    function fetchCredentials() {

        var requestInfo = {
            endPoint: GenerateURL({}, properties.api.credential_all),
            httpMethod: "GET",
            httpHeaders: { "Content-Type": "application/json" }
        }

        requestInfo.endPoint = requestInfo.endPoint + "?all=true";

        InvokeApi(requestInfo, CredentialsFetchSuccess, CredentialsFetchFailure);
        setState(new_state => ({
            ...new_state,
            credentials_status: "LOADING",
        }));
    }

    function CredentialsFetchSuccess(data) {

        if (data && data.results) {
            var credentials = data.results.length > 0 ? data.results.map(

                item => {
                    console.log(item, "fdsanfjknsajk")
                    return {
                        id: item.id,
                        label: item.name
                    }
                }
            ) : []
            setState(new_state => ({
                ...new_state,
                credential_list: credentials,
                credentials_status: "SUCCESS",
            }))
            setCredentialList(credentials)
        } else {
            setState(new_state => ({
                ...new_state,
                credential_list: [{ id: '', label: 'No Secret Added yet.' }],
                credentials_status: "SUCCESS",
            }));
            setCredentialList([{ id: '', label: 'No Secret Added yet.' }])
        }
    }

    function CredentialsFetchFailure(error, exception) {

        setState(new_state => ({
            ...new_state,
            credentials_status: "FAILED",
            error_in_load_credentials: error
        }));

    }

    const onDatabaseEndPointTypeChange = (e) => {
        const { name, value } = e.target;
        setState((prevState) => ({
            ...prevState,
            data: {
                database_end_point_type: value,
                name: prevState.data.name || '',
                credential: prevState.data.credential || '',
                // Explicitly clear these fields
                url: null,
                host: null,
                port: null
            },
            error: {},
            test_connection: false
        }));
    };

    console.log(state, "acbajgcvgdvcgvd")

    return (
        <CreateDatabaseDiv>
            <span>Configure Master Database</span>
            <div className='body'>
                <div className='body-main'>
                    <div className='description'>
                        <div className='d-flex f-direction-column' style={{ gap: '12px' }}>
                            <span className='font-14 font-weight-500 color-value'>Add Through</span>
                            <div style={{ height: "34px" }}>
                                <Input
                                    type={"custom-radio"}
                                    name={"database_end_point_type"}
                                    data={state.data}
                                    error={state.error}
                                    list={optionList}
                                    customRadio={StyledRadio}
                                    customLabel={CustomLabel}
                                    onChangeHandler={onDatabaseEndPointTypeChange}
                                />
                            </div>
                        </div>
                        <Grid container spacing={2} style={{ marginTop: "20px" }}>
                            {
                                state.data.database_end_point_type == 1000 ?
                                    <>
                                        <Grid item lg={6}>
                                            <Input
                                                type={"text"}
                                                name={"name"}
                                                label="Database Name"
                                                placeholder="Enter Name"
                                                data={state.data}
                                                error={state.error}
                                                info="Please specify master database name"
                                                onChangeHandler={commonFunctions.onChangeHandler}
                                            />
                                        </Grid>
                                        <Grid item lg={6}>
                                            <Input
                                                type={"text"}
                                                name={"url"}
                                                label="URL"
                                                placeholder="Copy paste URL"
                                                data={state.data}
                                                error={state.error}
                                                info="Please specify the Database URL string"
                                                onChangeHandler={commonFunctions.onChangeHandler}
                                            />
                                        </Grid>
                                    </>
                                    :
                                    <>
                                        <Grid item lg={12}>
                                            <Input
                                                type={"text"}
                                                name={"name"}
                                                label="Database Name"
                                                placeholder="Enter Name"
                                                data={state.data}
                                                error={state.error}
                                                info="Please specify master database name"
                                                onChangeHandler={commonFunctions.onChangeHandler} />
                                        </Grid>
                                        <Grid item lg={6}>
                                            <Input
                                                type={"text"}
                                                name={"host"}
                                                label="Host"
                                                placeholder="Enter database host"
                                                data={state.data}
                                                error={state.error}
                                                info="Please specify the Database Host name"
                                                onChangeHandler={commonFunctions.onChangeHandler}
                                            />
                                        </Grid>
                                        <Grid item lg={6}>
                                            <Input
                                                type={"text"}
                                                name={"port"}
                                                label="Port"
                                                placeholder="Enter database port"
                                                data={state.data}
                                                error={state.error}
                                                info="Please specific the Database port number"
                                                onChangeHandler={commonFunctions.onChangeHandler}
                                            />
                                        </Grid>
                                    </>
                            }
                            <div className='lower-div'>
                                <Input
                                    type="select"
                                    name="credential"
                                    list={state.credential_list}
                                    label="Credential"
                                    placeholder="Enter"
                                    //mandatorySign
                                    onChangeHandler={commonFunctions.onChangeHandler}
                                    data={state.data}
                                    error={state.error}
                                // extraDiv={
                                //     <Link className='text-anchor-blue d-flex align-center' to="/secrets/add"><AddIcon /> New Secret</Link>
                                // }
                                />
                                {
                                    state.test_loader ?
                                        <div style={{}}>
                                            <Loading varient="light" />
                                        </div>
                                        :
                                        <button className='back-btn' onClick={handleConnectionTest}>Test Connection</button>
                                }
                                <Grid container spacing={2} style={{ width: "100%" }}>
                                    {
                                        state.test_connection ?
                                            state.data.is_connected ?
                                                <Grid item xs={12} style={{ marginTop: "12px" }}>
                                                    <AlertStrip message={"Connection Established"} variant={"success"} />
                                                </Grid>
                                                :
                                                <Grid item xs={12} style={{ marginTop: "12px" }}>
                                                    <AlertStrip
                                                        message={
                                                            <>
                                                                <div className='d-flex align-center'>
                                                                    <div>
                                                                        Unable to establish a connection. Please validate the selected credential or select the appropriate credential to continue.
                                                                    </div>
                                                                </div>

                                                                {/* {state.error_msg && state.error_msg} */}
                                                            </>
                                                        }
                                                        variant={"error"} />
                                                </Grid>
                                            :
                                            null
                                    }
                                    {

                                        !state.test_connection && state.error.validation_failed &&

                                        <Grid item xs={12} style={{ marginTop: "12px" }}>
                                            <AlertStrip
                                                message={
                                                    <>
                                                        <div className='d-flex align-center'>
                                                            <div>
                                                                Ensure a credential is selected and the connection has been tested.
                                                            </div>
                                                        </div>

                                                        {/* {state.error_msg && state.error_msg} */}
                                                    </>
                                                }
                                                variant={"error"} />
                                        </Grid>

                                    }

                                </Grid>
                            </div>
                        </Grid>
                    </div>
                </div>
            </div>
        </CreateDatabaseDiv>
    )
}

const CreateDatabaseDiv = styled("div")({
    "& span": {
        fontFamily: "Montserrat",
        fontSize: "18px",
        fontWeight: "600",
        color: "#2F2F2F"
    },

    "& .body": {
        marginTop: "24px",

        "& .body-main": {
            paddingRight: "16px",
            // display: "grid",
            // gridTemplateColumns: "40% 60%",
            marginTop: "8px",
            // gap: "16px",

            "& .description": {
                // width: "100%",
                padding: "12px",
                // borderRadius: "6px",
                // border: "1px solid #E6E6E6",

                "& .description-header": {
                    paddingBottom: "10px",
                    fontFamily: "Montserrat",
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#404040",
                    borderBottom: "1px solid #E6E6E6"
                },

                "& .lower-div": {
                    width: "100%",
                    display: "grid",
                    gap: "10px",
                    gridTemplateColumns: "80% 20%",
                    alignItems: "center",
                    padding: "0 12px"
                }

            },

            "& .back-btn": {
                padding: "8px 16px",
                textTransform: "uppercase",
                height: "40px",
                fontSize: "12px",
                fontWeight: "600",
                color: "#124D9B",
                borderRadius: "6px",
                border: "1px solid #9DC0EE",
                backgroundColor: "#ffffff",
                transition: "all 0.4s ease-in-out",
                marginTop: "6px",

                "&:hover": {
                    backgroundColor: "#0086FF",
                    color: "#ffffff",
                    borderColor: "#0086FF"
                }
            },

            "& .replica-db-add": {
                backgroundColor: "#F8F8F8",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "130px",
                marginTop: "24px",

                "& .back-btn": {
                    padding: "8px 16px",
                    textTransform: "uppercase",
                    height: "40px",
                    fontFamily: "Montserrat",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#124D9B",
                    borderRadius: "6px",
                    border: "1px solid #9DC0EE",
                    backgroundColor: "#ffffff",
                    transition: "all 0.4s ease-in-out",
                    marginTop: "10px",

                    "&:hover": {
                        backgroundColor: "#0086FF",
                        color: "#ffffff",
                        borderColor: "#0086FF"
                    }
                }
            }
        },
    },

    '& .table-row-bp': {
        '& .main-label': {
            color: '#787878',
            textTransform: 'uppercase'
        },
        '& .caption-style': {
            color: '#787878'
        },
    },
})

export default CreateMasterDatabase
