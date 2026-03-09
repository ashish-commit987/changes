import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import PageHeader from '../../Components/PageHeader';
import Grid from '@mui/material/Grid';
import { Input } from '../../../../../components/genericComponents/Input';
import { makeStyles } from '@mui/styles';
import ManifestHandlerForCD from '../../../../../components/genericComponents/Forms/ManifestHandlerForCD';
import { getCommonFunctions, ResetComponent } from '../../../../serviceRevamp/add/ci_flow/SourceDetails';
import { Navigate, useParams, Link } from 'react-router-dom';
import InvokeApi, { PostData } from '../../../../../util/apiInvoker';
import GenerateURL from '../../../../../util/APIUrlProvider';
import properties from '../../../../../properties/properties';
import { ValidateDataSet, VALIDATION_TYPE_REQUIRED } from '../../../../../util/Validator';
import { Loading } from '../../../../utils/Loading';
import MultiRow, { getMultiRowDefaultState } from '../../../../../components/genericComponents/MultiRow';
import { getEnvDeployVarsWithCategories } from '../../../../serviceRevamp/add/cd_flow/CdInfo';
import ServiceHooks, { hookDataParserForReorderComponent, getAddPreHookState, hooksEditDataParser, getAddPostHookState } from '../../../../serviceRevamp/add/ci_flow/ServiceHooks';
export const MANIFEST_UPLOAD = "MANIFEST_UPLOAD";
export const MANIFEST_GIT = "MANIFEST_GIT";
export const MANIFEST_HELM = "MANIFEST_HELM";
import AlertStrip from '../../../../../components/AlertStrips';
import { useLocation } from 'react-router-dom';
import queryString from 'query-string';
import { showErrorHandlerForNested, showErrorHandlerUpdated } from '../../../../../util/util';
import InputSkeleton from '../../../../../components/genericComponents/Skeletons/InputSkeleton';
import Button from '../../../../../components/genericComponents/Button';
import { useCustomSnackbar } from '../../../../../contexts/SnackbarContext';

const supportedImagePullPolicies = [
  { id: "Always", label: "Always" },
  { id: "IfNotPresent", label: "If Not Present" },
  { id: "Never", label: "Never" },
]


const Manifest = (props) => {
  const classes = useStyles();
  const childInherits = {};
  const location = useLocation();
  const service_env_data = location?.state?.service_env_data || {};
  const inherits = props.inherits ? props.inherits : {};
  const manifest_meta_data_handler = {};
  const extraProps = location?.state ? { ...location.state } : { service_name: "default", project_env_name: "default", environment_master_name: "default" };

  console.log(service_env_data, extraProps, "advcgdhvcgdsvcs")

  const [state, setState] = useState(getManifestDefaultState(extraProps));
  const [showLoading, setShowLoading] = useState(false);
  const [canRedirect, setRedirect] = useState(false);
  const [resourceList, setResourceList] = useState(true);
  const { showSnackbar } = useCustomSnackbar();
  const { application_id, component_id, component_env_id, cd_id } = useParams();

  var parsed = queryString.parse(location.search);
  const clone_env_id = location?.state?.clone_env_id || parsed?.clone_env_id || null;
  const clone_deploy_id = location?.state?.clone_deploy_id || parsed?.clone_deploy_id || null;

  const is_same_env = location?.state?.is_same_env || null;
  const commonFunctions = getCommonFunctions(state, setState, inherits)

  const audit_history_status = parsed?.audit_history_status || "";
  const versioning_enabled = parsed.versioning_enabled ? parsed.versioning_enabled : null
  const is_edit = parsed.is_edit ? parsed.is_edit : false
  // const audit_history_status = props.audit_history_status;
  // const versioning_enabled = props.versioning_enabled




  function onSubmit() {
    var post_data_final = {};

    const result = manifest_meta_data_handler.validateForm ? manifest_meta_data_handler.validateForm() ? manifest_meta_data_handler.validateForm() : { valid: true } : { valid: true };
    var children_vaidation_result = inherits.validateForm ? inherits.validateForm() : { valid: true };
    var hooks_result = childInherits.validateForm ? childInherits.validateForm() ? childInherits.validateForm() : { valid: true } : { valid: true };
    var child_states = inherits.getState ? inherits.getState() : null
    var raw_env_var_state = child_states.env_var_raw_input;

    if (result.valid && children_vaidation_result.valid && hooks_result) {
      var hooks_data = childInherits.getState ? childInherits.getState() : {}
      if (state.cd_data) {
        post_data_final = {
          ...state.data,
          ...getHooksPostData(hooks_data)
        }

        if (is_edit) {
          console.log(state.cd_data.status, "hvggvggvgvvhvh")

          post_data_final.id = state.cd_data.id ? state.cd_data.id : null;
        }
        var manifest_file_data = { ...manifest_meta_data_handler.getData() };
        console.log(post_data_final, state, manifest_file_data, "post_data_finalpost_data_finalpost_data_final")
        if (manifest_file_data.helm_git_repo && manifest_file_data.helm_git_repo.choose_one) {
          if (manifest_file_data.helm_git_repo.choose_one == 1) {

            post_data_final = {
              ...state.data,
              ...getHooksPostData(hooks_data),
              manifest_meta_data: manifest_file_data,
              env_cd_deployment_strategy: {
                release_template_id: manifest_meta_data_handler.getData().release_template_id ?
                  manifest_meta_data_handler.getData().release_template_id : null
              }
            }
          } else {
            post_data_final = {
              ...state.data,
              ...getHooksPostData(hooks_data),
              helm_manifest_data: {
                "helm_integration_id": manifest_file_data.helm_git_repo.helm_integration_id,
                "helm_template": manifest_file_data.helm_git_repo.helm_template,
                "helm_version": manifest_file_data.helm_git_repo.helm_version
              },
              manifest_meta_data: {
                ...manifest_meta_data_handler.getData(),
                helm_file_paths: null,
                helm_git_repo: null,
                helm_git_repo_branch: null,
                helm_git_repo_id: null,
                strategy: manifest_file_data.strategy,
                value_file_paths: manifest_file_data.value_file_paths,
              },
              env_cd_deployment_strategy: {
                release_template_id: manifest_meta_data_handler.getData().release_template_id ?
                  manifest_meta_data_handler.getData().release_template_id : null
              }
            }
            console.log("hrueuiuwieuwi", post_data_final);
            delete post_data_final.manifest_meta_data.helm_file_paths;
            delete post_data_final.manifest_meta_data.helm_git_repo
            delete post_data_final.manifest_meta_data.helm_git_repo_branch
            delete post_data_final.manifest_meta_data.helm_git_repo_id
          }
        } else {
          if (manifest_file_data.manifest_file_paths && manifest_file_data.manifest_file_paths.length > 0) {
            post_data_final = {
              ...post_data_final,
              manifest_meta_data: {
                ...manifest_meta_data_handler.getData()
              }
            }
          }
        }

        post_data_final.env_cd_deployment_strategy = {
          ...state.cd_data.env_cd_deployment_strategy,
          release_template_id: manifest_meta_data_handler.getData().release_template && manifest_meta_data_handler.getData().release_template_id ?
            manifest_meta_data_handler.getData().release_template_id : null,
        }
        post_data_final.status = state.cd_data.status ? state.cd_data.status : null;
      } else {

        var manifest_file_data = { ...manifest_meta_data_handler.getData() };
        console.log(post_data_final, state, "post_data_finalpost_data_finalpost_data_final")
        post_data_final = {
          ...state.data,
          ...getHooksPostData(hooks_data),
          manifest_meta_data: manifest_file_data,
          env_cd_deployment_strategy: {
            release_template_id: manifest_meta_data_handler.getData().release_template_id ?
              manifest_meta_data_handler.getData().release_template_id : null
          }
        }
        if (manifest_file_data.helm_git_repo && manifest_file_data.helm_git_repo.choose_one) {
          if (manifest_file_data.helm_git_repo.choose_one == 1) {

            post_data_final = {
              ...state.data,
              ...getHooksPostData(hooks_data),
              manifest_meta_data: manifest_file_data,
              env_cd_deployment_strategy: {
                release_template_id: manifest_meta_data_handler.getData().release_template_id ?
                  manifest_meta_data_handler.getData().release_template_id : null
              }
            }
          } else {

            post_data_final = {
              ...state.data,
              ...getHooksPostData(hooks_data),
              helm_manifest_data: {
                "helm_integration_id": manifest_file_data.helm_git_repo.helm_integration_id,
                "helm_template": manifest_file_data.helm_git_repo.helm_template,
                "helm_version": manifest_file_data.helm_git_repo.helm_version
              },
              manifest_meta_data: {
                ...manifest_meta_data_handler.getData(),
                helm_file_paths: null,
                helm_git_repo: null,
                helm_git_repo_branch: null,
                helm_git_repo_id: null,
                strategy: manifest_file_data.strategy,
                value_file_paths: manifest_file_data.value_file_paths,
              },
              env_cd_deployment_strategy: {
                release_template_id: manifest_meta_data_handler.getData().release_template_id ?
                  manifest_meta_data_handler.getData().release_template_id : null
              }
            }
            delete post_data_final.manifest_meta_data.helm_file_paths;
            delete post_data_final.manifest_meta_data.helm_git_repo
            delete post_data_final.manifest_meta_data.helm_git_repo_branch
            delete post_data_final.manifest_meta_data.helm_git_repo_id
          }
          console.log(post_data_final, "post_data_finalpost_data_finalpost_data_final")
        }

      }
      console.log(post_data_final, "post_data_finalpost_data_finalpost_data_final")
      var env_cd_deploy_variable = [];

      if (raw_env_var_state && raw_env_var_state.multi_row) {
        Object.keys(raw_env_var_state.multi_row).forEach(key => {
          if (key == "data" || key == "child_inherits" || key == 'show_view' || key == "count") {

          } else {
            env_cd_deploy_variable = [...env_cd_deploy_variable, raw_env_var_state.multi_row[key].data]
          }
        })
        post_data_final.env_cd_deploy_variable = env_cd_deploy_variable
      }
      console.log(post_data_final, "post_data_finalpost_data_finalpost_data_final")
      setShowLoading(true);
      showSnackbar("info", "Saving manifest configuration...");
      if (versioning_enabled && (state.cd_data && state.cd_data.id) && is_edit) {
        PostData(GenerateURL({ service_id: component_id, component_env_id: component_env_id, id: state.cd_data.id }, properties.api.edit_cd), { ...post_data_final, component_env_id: Number(component_env_id) }, onSaveSuccess, onSaveFail)
      } else {
        if (state.cd_data && state.cd_data.id && is_edit) {
          PostData(GenerateURL({ service_id: component_id, component_env_id: component_env_id, id: state.cd_data.id }, properties.api.edit_cd), { ...post_data_final, component_env_id: Number(component_env_id) }, onSaveSuccess, onSaveFail)
        } else {
          PostData(GenerateURL({ service_id: component_id, component_env_id: component_env_id }, properties.api.save_cd), { ...post_data_final, component_env_id: Number(component_env_id) }, onSaveSuccess, onSaveFail)
        }
      }
    } else {

    }
  }

  function onSaveFail(error) {
    setShowLoading(false);
    showSnackbar("error", "Failed to save manifest configuration. Please try again.");

    setState((new_state) => ({
      ...new_state,
      error_in_save_cd: showErrorHandlerForNested(error)
    }))

  }

  const validateForm = () => {
    const result = ValidateDataSet(state.data, state.validations);
    if (!result.valid) {
      setState(new_state => ({
        ...new_state,
        error: {
          ...new_state.error,
          ...result.error
        }
      }));
    }
    return {
      valid: result.valid,
      error: {
        ...result.error,
      }
    };

  }



  function onSaveSuccess(response) {
    setShowLoading(false);
    showSnackbar("success", "Manifest configuration saved successfully.");
    setRedirect(true);
  }
  useEffect(() => {
    fetchResourceKind();
    fetchEnvData()
    if (is_edit) {

      fetchCdData()
    } else {
      // if ((window.location.href).toString().charAt((window.location.href).toString().length - 1) == "D") {

      //   if (clone_env_id || clone_deploy_id) {
      //     fetchCdData();
      //   }
      // }
      if (clone_env_id || clone_deploy_id) {
        fetchCdData();
      }
    }
  }, [])

  function fetchEnvData() {
    var requestInfo = {
      endPoint: GenerateURL({ service_id: component_id, env_id: component_env_id }, properties.api.env_data_update_url),
      httpMethod: "GET",
      httpHeaders: { "Content-Type": "application/json" }
    }

    InvokeApi(requestInfo, handleSuccess, handleFailed);
    setState(new_state => ({
      ...new_state,
      env_data_loading: true,
    }))
  }

  function handleSuccess(response) {
    if (response?.project_env && response?.project_env?.namespaces?.length > 0) {
      getNamespaceList();
    }
  }

  function handleFailed(error) {
    setState(new_state => ({
      ...new_state,
      env_data_loading: false,
    }))
  }

  function getNamespaceList() {
    var requestInfo = {
      endPoint: GenerateURL({ component_env_id: component_env_id }, properties.api.get_namespace_list_per_componentenv),
      httpMethod: "GET",
      httpHeaders: { "Content-Type": "application/json" }
    }
    InvokeApi(requestInfo,
      (response) => {
        if (response.length > 0) {
          setState((prev) => ({
            ...prev,
            validations: {
              ...prev.validations,
              selected_namespace_id: [VALIDATION_TYPE_REQUIRED],
            },
            namespace_list: response.map((ele) => ({ id: ele.id, label: ele.name })),
            env_data_loading: false,
          }))
        }
      },
      (error) => {
        setState((prev) => ({
          ...prev,
          namespace_list: [],
          env_data_loading: false,
        }))
      }
    );
  }

  function getHooksPostData(hooks_data) {
    var post_data = {};
    var pre_hook_array = new Array();
    var post_hook_array = new Array();
    if (hooks_data.add_post_hook && (hooks_data.add_post_hook.post_hook_childs && Object.keys(hooks_data.add_post_hook.post_hook_childs).length > 3)) {
      post_hook_array = hookDataParserForReorderComponent(hooks_data.add_post_hook.post_hook_childs, "POST");
    }
    if (hooks_data.add_pre_hook && (hooks_data.add_pre_hook.pre_hook_childs && Object.keys(hooks_data.add_pre_hook.pre_hook_childs).length > 3)) {

      pre_hook_array = hookDataParserForReorderComponent(hooks_data.add_pre_hook.pre_hook_childs, "PRE");
    }
    post_data.env_cd_hook = (hooks_data.add_post_hook || hooks_data.add_pre_hook) ? [...pre_hook_array, ...post_hook_array] : []
    post_data.queue_name = hooks_data.data.queue_name && hooks_data.data.queue_name !== "" ? hooks_data.data.queue_name : null
    return post_data;
  }

  function fetchCdData() {
    var requestInfo = {
      endPoint: GenerateURL({ service_id: component_id, component_env_id: clone_env_id ? clone_env_id : component_env_id }, properties.api.save_cd),
      httpMethod: "GET",
      httpHeaders: { "Content-Type": "application/json" }
    }
    if (is_edit) {
      requestInfo.endPoint = GenerateURL({ service_id: component_id, component_env_id: component_env_id, id: cd_id }, properties.api.edit_cd)
    }
    if (clone_env_id && clone_deploy_id) {
      requestInfo.endPoint = GenerateURL({ service_id: component_id, component_env_id: clone_env_id, id: clone_deploy_id }, properties.api.edit_cd)
    }
    setShowLoading(true);
    InvokeApi(requestInfo, onEditFetchSuccess, onEditFetchFail)
  }


  function onEditFetchSuccess(data) {
    console.log(data, "acbhdbchd")
    var response;
    if (Array.isArray(data)) {
      var cd = data.filter(item => item.status == audit_history_status)
      response = cd[0] ? cd[0] : []
    } else {
      response = data
    }
    var envVarCategories = getEnvDeployVarsWithCategories(response.env_cd_deploy_variable)
    var only_pre_hooks_list = new Array();
    if (response.env_cd_hook && response.env_cd_hook.length > 0) {
      response.env_cd_hook.forEach(item => {
        if (item.action_type == "PRE") {
          only_pre_hooks_list.push(item);
        }
        return only_pre_hooks_list;
      })
    }
    var only_post_hooks_list = new Array();
    if (response.env_cd_hook && response.env_cd_hook.length > 0) {
      response.env_cd_hook.forEach(item => {
        if (item.action_type == "POST") {
          only_post_hooks_list.push(item);
        }
        return only_post_hooks_list;
      })
    }
    setShowLoading(false);
    var obj = {}
    if (is_same_env || is_edit) {
      obj = {
        deployment_name: response.deployment_name,
        service_name: response.service_name,
      }
    }
    if (response?.resource_custom_kind) {
      setResourceList(false);
    }
    setState(new_state => ({
      ...new_state,
      resourceKindList: response?.resource_kind ? [{ label: response.resource_kind, id: response.resource_kind }] : response?.resource_custom_kind ? [{ label: response.resource_custom_kind, id: response.resource_custom_kind }] : [],
      data: {
        ...new_state.data,
        id: response.id,
        image_name: response.image_name,
        // deployment_name: response.deployment_name,
        // service_name: response.service_name,
        ...obj,
        image_pull_policy: response.image_pull_policy,
        deploy_variable_raw_input: response.env_cd_deploy_variable && response.env_cd_deploy_variable.length > 0 ? true : false,
        deployment_names: response.deployment_names ? response.deployment_names.length > 0 ? response.deployment_names : [] : [],
        deployment_rollback_validation: response.deployment_rollback_validation ? true : false,
        pre_hook_enabled: hooksEditDataParser(only_pre_hooks_list, "PRE")["1"] ? true : false,
        post_hook_enabled: hooksEditDataParser(only_post_hooks_list, "POST")["1"] ? true : false,
        queue_name: data.queue_name ? data.queue_name : null,
        resource_kind: response.resource_kind ? response.resource_kind : null,
        resource_custom_kind: response.resource_custom_kind ? response.resource_custom_kind : null,
        server_side_apply: response?.server_side_apply ? response.server_side_apply : false,
        selected_namespace_id: response?.selected_namespace?.id
      },
      //edit data for hooks functions
      ...{
        add_pre_hook: {
          ...getAddPreHookState(),
          pre_hook_childs: {
            ...hooksEditDataParser(only_pre_hooks_list, "PRE"),
            data: {},
            child_inherits: { ...hooksEditDataParser(only_pre_hooks_list, "PRE") }
          }
        },
        add_post_hook: {
          ...getAddPostHookState(),
          post_hook_childs: {
            ...hooksEditDataParser(only_post_hooks_list, "POST"),
            data: {},
            child_inherits: { ...hooksEditDataParser(only_post_hooks_list, "POST") }
          }
        },
      },
      env_var_raw_input: {
        ...getEnabledComponentRawInputDefaultState(),
        multi_row: envVarCategories ? {
          ...getMultiRowDefaultState(),
          ...getKeyValEnvVars(envVarCategories.keyVal)
        } : {}
      },
      cd_data: response,
    }));
  }

  function onEditFetchFail(error) {
    setShowLoading(false);
  }

  function onChangeHandlerForKeyValue(key, value) {
    console.log("hudhsja", key, value);
    if (key == "components") {
      value.forEach((id, index) => {
        value[index] = Number(id);
      });
    }
    setState({
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
  }

  function fetchResourceKind() {
    let requestInfo = {
      endPoint: GenerateURL({ component_env_id: component_env_id }, properties.api.resource_kind),
      httpMethod: "GET",
      httpHeaders: { "Content-Type": "application/json" },
    }
    setShowLoading(true);
    InvokeApi(requestInfo, fetchResourceKindSuccess, fetchResourceKindFailed);
  }

  function fetchResourceKindSuccess(response) {
    console.log("aslkdjfhb", response);
    let resourceKindList = response?.resources?.map((item) => ({ label: item, id: item })) || [];
    setState((prev_state) => ({
      ...prev_state,
      resourceKindList: resourceKindList.length > 0 ? resourceKindList : null,

    }))
    setShowLoading(false);
  }

  function fetchResourceKindFailed(error) {
    console.log("alKSJBXV", error);
    setShowLoading(false);
  }

  function toggleResourceState() {
    if (resourceList) {
      setState((prev_state) => ({
        ...prev_state,
        data: {
          ...prev_state.data,
          resource_kind: null,
        }
      }))
    } else {
      setState((prev_state) => ({
        ...prev_state,
        data: {
          ...prev_state.data,
          resource_custom_kind: null,
        }
      }))
    }

    setResourceList(!resourceList);
  }

  function onChangeNamespace(key, value) {
    if (value) {
      setState((prev) => {
        let selectedNamespace = state.namespace_list.find((ele) => ele.id === value);
        return {
          ...prev,
          data: {
            ...prev.data,
            [key]: value,
            selected_namespace_name: selectedNamespace.label,
            selected_namespace_istio: selectedNamespace?.istio_enabled
          }
        }
      })
    }
  }

  return (
    <div className={classes.root}>
      <Grid container>
        <Grid item lg={12}>
          <PageHeader
            title="Manifest Information"
            service_name={extraProps.service_name}
            env_name={extraProps.environment_master_name}
            sub_env_name={extraProps.project_env_name}
            service_env_data={service_env_data}
          />
        </Grid>
        {state.error_in_save_cd && <AlertStrip variant="error" message={state.error_in_save_cd} />}
        <Grid item lg={12}>
          <div className={classes.formDiv}>

            {/* {
              showLoading ? <Loading /> : null
            } */}
            {
              canRedirect ? <Navigate to={"/application/" + application_id + "/service/" + component_id + "/detail?env_id=" + component_env_id + "&deploy_details=true"} /> : null
            }


            <Grid container >
              <Grid lg={12} direction="row">
                <div className='' style={{ margin: '1.5rem 0rem', boxShadow: 'none' }}>

                  {/* <Grid lg={12} direction="row" style={{ marginTop: '20px' }} > */}
                  <div className='card'>
                    <div className="pd-10">
                      <Grid container spacing="2">
                        <Grid item lg={6}>
                          <Input
                            type="text"
                            placeholder="service-env-master-project-env"
                            name="deployment_name"
                            label="Deployment Name"
                            mandatorySign
                            error={state.error}
                            onChangeHandler={commonFunctions.onChangeHandler}
                            data={state.data} />

                        </Grid>
                        <Grid item lg={6}>
                          <Input
                            type="text"
                            placeholder="service-envmaster-project-env"
                            name="service_name"
                            label="Service Name"
                            mandatorySign
                            error={state.error}
                            onChangeHandler={commonFunctions.onChangeHandler}
                            data={state.data} />

                        </Grid>

                        {/* <Grid item lg={6}>
                          <Input
                            type="text"
                            placeholder="service-test/env-master-test/project-env-test"
                            name="image_name"
                            label="Image Name"
                            mandatorySign
                            error={state.error}
                            onChangeHandler={commonFunctions.onChangeHandler}
                            data={state.data} />

                        </Grid> */}
                        <Grid item lg={6}>
                          <Input
                            mandatorySign
                            type="select"
                            placeholder="Image pull Policy"
                            list={supportedImagePullPolicies}
                            label="Image Pull Policy"
                            name="image_pull_policy"
                            onChangeHandler={commonFunctions.onChangeHandler}
                            data={state.data}
                            error={state.error}
                          />
                        </Grid>
                        <Grid item lg={6} style={{ marginTop: '-15px' }}>
                          <Input
                            type={resourceList ? "select" : "text"}
                            placeholder=""
                            list={state.resourceKindList}
                            label="Resource Kind"
                            name={resourceList ? "resource_kind" : "resource_custom_kind"}
                            onChangeHandler={resourceList ? state.resourceKindList?.length > 1 ? commonFunctions.onChangeHandler : null : commonFunctions.onChangeHandler}
                            data={state.data}
                            error={state.error}
                            extraDiv={<button className="btn btn-clear mr-0 btn-link text-anchor-blue pr-0" onClick={toggleResourceState}>{resourceList ? "Provide Custom Kind" : "Select Kind"}</button>}
                          />
                        </Grid>
                        {state.env_data_loading ?
                          <InputSkeleton
                            type={'text'}
                          />
                          :
                          state?.namespace_list?.length > 0 ?
                            <Grid item lg={6}>
                              <div className="auto-complete-dropdown auto-complete-dropdown-42">
                                <Input
                                  type="auto-complete-dropdown" // "select"
                                  name="selected_namespace_id"
                                  list={state?.namespace_list?.length > 0 ? state.namespace_list : []}
                                  label="Select Namespace"
                                  onChangeHandler={onChangeNamespace}
                                  data={state.data}
                                  error={state.error}
                                  mandatorySign
                                  getOptionLabel={(option) => option.label}
                                  info={"The namespaces listed here are only those that are associated with the registry selected in the service environment."}
                                />
                              </div>
                            </Grid>
                            : null
                        }
                        <Grid item lg={12}>
                          <div className='section'>
                            <Input
                              type="tagged-input"
                              placeholder="Add additional deployment names"
                              label="Widget Data"
                              subHeading="(Deployment Analytics)"
                              name="deployment_names"
                              data={state.data}
                              error={state.error}
                              onChangeHandler={onChangeHandlerForKeyValue}
                            />
                          </div>
                        </Grid>

                        <Grid item lg={12}>
                          <div className="card card-switch box-shadow-none " >
                            <Input
                              type="switch"
                              name="deploy_variable_raw_input"
                              label="Define Raw Key Value Pairs"
                              onChangeHandler={commonFunctions.toggleState}
                              data={state.data}
                              error={state.error}
                              enabledComponent={<EnabledComponentRawInput prev_state={state.env_var_raw_input} inherits={state.child_inherits.env_var_raw_input} zeroRowsAllowed={true} />}
                              disabledComponent={<ResetComponent inherits={state.child_inherits.env_var_raw_input} />}
                            />
                          </div>
                        </Grid>
                        <Grid item lg={12} className="pd-10">
                          <div className='card'>
                            <div className='heading'>
                              <Input
                                type="switch"
                                name="deployment_rollback_validation"
                                label="Validate Deployment Rollout"
                                // subHeading="(User can provide value in number or in percentage 1 or 25%)"
                                data={state.data}
                                error={state.error}
                                onChangeHandler={commonFunctions.toggleState}
                              />
                            </div>
                          </div>
                        </Grid>
                        <Grid item lg={12} className="pd-10">
                          <div className='card'>
                            <div className='heading'>
                              <Input
                                type="switch"
                                name="server_side_apply"
                                label="Server Side Apply"
                                // subHeading="(User can provide value in number or in percentage 1 or 25%)"
                                data={state.data}
                                error={state.error}
                                onChangeHandler={commonFunctions.toggleState}
                                info={
                                  <>
                                    <strong>Applies the manifest using Kubernetes server-side apply.</strong>
                                  </>
                                }
                              />
                            </div>
                          </div>
                        </Grid>
                        <Grid item lg={12}>
                          <ManifestHandlerForCD cd_data={state.cd_data} inherits={manifest_meta_data_handler} />
                          {/* <ManifestHandler cd_data={state.cd_data} inherits={manifest_meta_data_handler} /> */}
                        </Grid>
                        <Grid item lg={12} className="pd-10">
                          <ServiceHooks inherits={childInherits} prev_state={state} type="manifest" />
                        </Grid>
                      </Grid>
                    </div>
                    <div className="card-footer space-between">
                      <Link to={"/application/" + application_id + "/service/" + component_id + "/detail?env_id=" + component_env_id + "&deploy_details=true"}>
                        <button className="btn btn-outline-grey">Back</button>
                      </Link>
                      <div style={{ marginLeft: 'auto' }}>
                        <Button className="btn btn-submit" onClick={onSubmit} isLoading={showLoading}>Save &amp; Continue</Button>
                      </div>

                    </div>
                  </div>
                </div>
              </Grid>
            </Grid>
          </div>
        </Grid>
      </Grid>
    </div>
  )
}

Manifest.propTypes = {
  ...PropTypes.objectOf(PropTypes.any),
};

export default Manifest;
function getDeafultStateTest() {
  return {
    data: {},
    error: {},
    validations: {}
  }
}



const ComponentTest = (props) => {
  const inherits = props.inherits ? props.inherits : {};
  const prev_state = props.prev_state ? props.prev_state : null;
  const [state, setState] = useState(prev_state ? prev_state : getDeafultStateTest())
  const commonFunctions = getCommonFunctions(state, setState, inherits);
  return (
    <div className="pd-10">
      <Input
        type="text"
        placeholder="service-test/env-master-test/project-env-test"
        name="data_one"
        label="data one Name"
        mandatorySign
        error={state.error}
        onChangeHandler={commonFunctions.onChangeHandler}
        data={state.data} />
      <Input
        type="text"
        placeholder="service-test/env-master-test/project-env-test"
        name="data_tow"
        label="data tow Name"
        mandatorySign
        error={state.error}
        onChangeHandler={commonFunctions.onChangeHandler}
        data={state.data} />
    </div>
  )
}

ComponentTest.propTypes = {
  ...PropTypes.objectOf(PropTypes.any),
};


const EnabledComponentRawInput = (props) => {
  const inherits = props.inherits ? props.inherits : {};
  const prev_state = props.prev_state ? props.prev_state : null;
  const [state, setState] = useState(prev_state ? prev_state : getEnabledComponentRawInputDefaultState())
  const commonFunctions = getCommonFunctions(state, setState, inherits);



  return (
    <div className='card-body-flex'>


      <MultiRow RepeatableComponent={RawInputBody} HeaderComponent={RawInputHeader} prev_state={state.multi_row} inherits={state.child_inherits.multi_row} zeroRowsAllowed={true} />


    </div>

  )
}
EnabledComponentRawInput.propTypes = {
  ...PropTypes.objectOf(PropTypes.any),
};


function getEnabledComponentRawInputDefaultState() {
  return {
    data: {},
    error: {},
    validations: {},
    child_inherits: {
      multi_row: {
        "validateForm": () => { return { valid: true }; },
        "getState": () => { return {}; },
        "getData": () => { return {}; }
      }
    }
  };
}
const RawInputBody = (props) => {
  const inherits = props.inherits ? props.inherits : {};
  const prev_state = props.prev_state ? props.prev_state : null;
  const [state, setState] = useState(prev_state ? prev_state : getRawInputBodyDefaultState())
  const commonFunctions = getCommonFunctions(state, setState, inherits);

  return (
    <>
      <Grid item lg={5}>
        <Input
          type="text"
          placeholder="Name"
          name="env_key"
          error={state.error}
          onChangeHandler={commonFunctions.onChangeHandler}
          data={state.data} />
      </Grid>

      <Grid item lg={5}>
        <Input
          type="text"
          placeholder="Value"
          name="env_value"
          error={state.error}
          onChangeHandler={commonFunctions.onChangeHandler}
          data={state.data} />
      </Grid>


    </>
  )
}

RawInputBody.propTypes = {
  ...PropTypes.objectOf(PropTypes.any),
};

export function getRawInputBodyDefaultState() {
  return {
    data: {},
    error: {},
    validations: {
      env_key: [VALIDATION_TYPE_REQUIRED],
      env_value: [VALIDATION_TYPE_REQUIRED],
    },
  };
}
function RawInputHeader() {
  return (
    <>
      <Grid item lg={5}>
        Key
      </Grid>
      <Grid item lg={5}>
        Value
      </Grid>
    </>
  )
}
function getKeyValEnvVars(keyVals) {
  var keyValsList = {};
  var count = 1;
  var child_inherits = {}
  if (keyVals) {
    keyVals.forEach(keyVal => {
      keyValsList = {
        ...keyValsList, [count]: {
          ...getRawInputBodyDefaultState(),
          data: {
            ...keyVal
          }
        }
      }
      child_inherits = { ...child_inherits, [count++]: {} }

    });
  }
  return { ...keyValsList, child_inherits: child_inherits };
}


const useStyles = makeStyles(() => ({
  root: {
    padding: '20px'
  }
}));

export function getManifestDefaultState(extraProps) {

  const service_name = extraProps.service_name;
  const env_master = extraProps.environment_master_name;
  const project_env_name = extraProps.project_env_name;
  const deploy_name = service_name ? (service_name + "-" + env_master + "-" + project_env_name) : null;
  return {
    data: {
      service_name: service_name + "-" + env_master + "-" + project_env_name,
      // image_name: service_name + "/" + env_master + "/" + project_env_name,
      deployment_name: service_name + "-" + env_master + "-" + project_env_name,
      deploy_variable_raw_input: false,
      deployment_rollback_validation: true,
      deployment_names: [deploy_name],
      pre_hook_enabled: false,
      post_hook_enabled: false,
      server_side_apply: false,
    },
    error: {
      service_name: "",
      deployment_name: "",
      // image_name: ""
    },
    validations: {
      service_name: [VALIDATION_TYPE_REQUIRED],
      deployment_name: [VALIDATION_TYPE_REQUIRED],
      // image_name: [VALIDATION_TYPE_REQUIRED],
      image_pull_policy: [VALIDATION_TYPE_REQUIRED]
    },
    child_inherits: {
      // manifest_meta_data: {},
      env_var_raw_input: {
        "validateForm": () => { return { valid: true }; },
        "getState": () => { return {}; },
        "getData": () => { return {}; }
      },
      add_pre_hook: {
        "validateForm": () => { return { valid: true } },
        "getState": () => { return {} },
        "getData": () => { return {} }
      },
      add_post_hook: {
        "validateForm": () => { return { valid: true } },
        "getState": () => { return {} },
        "getData": () => { return {} }
      }
    }
  }
}
