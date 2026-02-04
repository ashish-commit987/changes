import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Input } from "../../../../components/genericComponents/Input";
import {
  VALIDATION_TYPE_REQUIRED,
  ValidateDataSet,
} from "../../../../util/Validator";
import {
  ConvertPipelineObjtoYAML,
  ConvertPipelineYAMLtoObj,
} from "../../../../controllers/PipelineController";
import { styled } from "@mui/system";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { Workflow } from "./Workflow";
import { JobForm } from "./JobForm";
import Base64 from "base-64";
import ParseFile from "../../../../util/FileParser";
import ConditionsDialog from "./ConditionsDialog";
import { makeStyles } from "@mui/styles";
import {
  getStageRunConditionsAndJiraRefList,
  RemoveFromArray,
  showErrorHandlerUpdated,
} from "../../../../util/util";
import GenerateURL from "../../../../util/APIUrlProvider";
import InvokeApi from "../../../../util/apiInvoker";
import properties from "../../../../properties/properties";
import QuestionnaireDialog, {
  getJiraRefid,
  getSnowRefid,
} from "./QuestionnaireDialog";
import Dialog from "@mui/material/Dialog";
import Slide from "@mui/material/Slide";
import { Loading } from "../../../utils/Loading";
import AlertStrip from "../../../../components/AlertStrips";
import SkeletonLoadingStageForm from "./SkeletonLoadingStageForm";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="left" ref={ref} {...props} />;
});
const tabList = [
  {
    tabName: "UI VIEW",
    tabStatus: null,
    order: 1,
  },
  {
    tabName: "YAML View",
    tabStatus: null,
    order: 2,
  },
];

export const ADD_STAGE = "ADD_STAGE";
export const ADD_JOB = "ADD_JOB";
export const WORKFLOW = "WORKFLOW";
export const EDIT_STAGE = "EDIT_STAGE";
export const EDIT_JOB = "EDIT_JOB";

const StageForm = (props) => {
  const pipeline = props.pipeline ? props.pipeline : null;
  const application = props.application;
  const stages = props.stages;
  console.log(stages, "stage_form");
  const addOrUpdateStage = props.addOrUpdateStageCallback;
  const varient = props.varient;
  const open = props.open;
  const stage_index = props.stage_index;
  const job_index = props.job_index;
  const showAddJobForm = props.showAddJobForm;
  const showWorkflow = props.showWorkflow;
  const showAddStageForm = props.showAddStageForm;
  const deleteStage = props.deleteStage;
  const editStage = props.editStage;
  const editJob = props.editJob;
  const deleteJob = props.deleteJob;
  const [state, setState] = useState(resolveState);
  const updateError = props.updateError;
  const updateStages = props.updateStages;
  const classes = useStylesDialog();
  const handleClickClose = props.handleClickClose;
  const present_stage_name = props.present_stage_name;

  function resolveState() {
    return {
      selected_tab: 1,
    };
  }
  console.log(stage_index, "lqlqlql++");
  useEffect(() => {
    setState({
      ...state,
      ...resolveState(),
    });
  }, [varient, job_index, stage_index]);

  const updateSelectedTab = (tab_order) => {
    setState({
      ...state,
      selected_tab: tab_order,
    });
  };

  function getRequestedForm() {
    switch (varient) {
      case ADD_STAGE:
        return (
          <Form
            application_id={application.id}
            pipeline_data={pipeline}
            showWorkflow={showWorkflow}
            stages={stages}
            get_stage_index={stage_index}
            handleClickCloseDialog={handleClickClose}
            addOrUpdateStageCallback={addOrUpdateStage}
          />
        );
      case ADD_JOB:
        return (
          <JobForm
            stage_index={stage_index}
            get_job_index={job_index}
            pipeline={pipeline}
            application={application}
            stages={stages}
            handleClickCloseDialog={handleClickClose}
            addOrUpdateStageCallback={addOrUpdateStage}
            showWorkflow={showWorkflow}
            all_project_envs={props.all_project_envs}
            present_stage_name={props.present_stage_name}
          />
        );
      case EDIT_JOB:
        return (
          <JobForm
            stage_index={stage_index}
            job_index={job_index}
            get_job_index={job_index}
            pipeline={pipeline}
            application={application}
            stages={stages}
            handleClickCloseDialog={handleClickClose}
            varient={varient}
            addOrUpdateStageCallback={addOrUpdateStage}
            showWorkflow={showWorkflow}
            all_project_envs={props.all_project_envs}
          />
        );
      case WORKFLOW:
        return (
          <Workflow
            deleteStage={deleteStage}
            editStage={editStage}
            editJob={editJob}
            deleteJob={deleteJob}
            stages={stages}
            showAddJobForm={showAddJobForm}
            showAddStageForm={showAddStageForm}
          />
        );
      case EDIT_STAGE:
        return (
          <Form
            application_id={application.id}
            varient={varient}
            pipeline_data={pipeline}
            stage_index={stage_index}
            showWorkflow={showWorkflow}
            stages={stages}
            handleClickCloseDialog={handleClickClose}
            addOrUpdateStageCallback={addOrUpdateStage}
          />
        );
      default:
        return (
          <Workflow
            deleteStage={deleteStage}
            editStage={editStage}
            editJob={editJob}
            deleteJob={deleteJob}
            stages={stages}
            showAddJobForm={showAddJobForm}
            showAddStageForm={showAddStageForm}
          />
        );
    }
  }

  console.log(open, "lqlqlqlq+++");
  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      keepMounted
      onClose={handleClickClose}
      className={classes.dialog_root + " " + " integrations-dialog"}
      aria-labelledby="alert-dialog-slide-title"
      aria-describedby="alert-dialog-slide-description"
    >
      <div className="pipeline-right-content">
        {state.selected_tab == 1 ? (
          getRequestedForm()
        ) : (
          <YAMLForm
            updateError={updateError}
            updateStages={updateStages}
            pipeline={pipeline}
            stages={props.stages}
            application={application}
            all_project_envs={props.all_project_envs}
          />
        )}
      </div>
    </Dialog>
  );
};

StageForm.propTypes = {
  ...PropTypes.objectOf(PropTypes.any),
};

export default StageForm;

const Form = (props) => {
  const stages = props.stages;
  const pipeline_data = props.pipeline_data ? props.pipeline_data : null;
  console.log("QuestionnaireDialog", pipeline_data);
  var approved_role_ids = [];
  var approved_user_ids = [];
  var check_if_role_ids_already_exists = [];
  var check_if_user_ids_already_exists = [];
  const stage_index = props.stage_index;
  if (stages && stages.length > 0) {
    if (stages[stage_index]) {
      if (
        stages[stage_index].approve_user &&
        stages[stage_index].approve_user.length > 0
      ) {
        stages[stage_index].approve_user.forEach((element) => {
          console.log(element, "fsdfsadfsafsa");
          if (
            !check_if_role_ids_already_exists.includes(element.role_master_id)
          ) {
            check_if_role_ids_already_exists.push(element.role_master_id);
            approved_role_ids.push(element.role_master_id);
          }
        });
        stages[stage_index].selected_roles_pipeline_approval =
          approved_role_ids;
      }
    }
  }
  if (stages && stages.length > 0) {
    if (stages[stage_index]) {
      if (
        stages[stage_index].approve_user &&
        stages[stage_index].approve_user.length > 0
      ) {
        stages[stage_index].approve_user.forEach((element) => {
          if (!check_if_user_ids_already_exists.includes(element.id)) {
            check_if_user_ids_already_exists.push(element.id);
            approved_user_ids.push(element.id);
          }
        });
        stages[stage_index].selected_users_pipeline_approval =
          approved_user_ids;
      }
    }
  }
  const addOrUpdateStage = props.addOrUpdateStageCallback;
  const showWorkflow = props.showWorkflow;
  const varient = props.varient;

  const classes = useStyles();
  const application_id = props.application_id;
  const default_data = {
    name: "",
    approval: false,
    selected_users_pipeline_approval: [],
    selected_roles_pipeline_approval: [],
    roles_list: [],
    send_mail: true,
    stage_run_condition: {},
    jira_reference_approver: false,
    jira_issue_reference: null,
    snow_reference_approver: false,
    snow_issue_reference: null,
    approval_questions: false,
  };
  const data =
    stage_index || stage_index == 0 ? stages[stage_index] : default_data;
  if (data && data.jira_issue_reference) {
    data.jira_reference_approver = true;
  } else {
    data.jira_reference_approver = false;
  }

  if (data && data.snow_issue_reference) {
    data.snow_reference_approver = true;
  } else {
    data.snow_reference_approver = false;
  }

  const [state, setState] = useState({
    data: data,
    error: {},
    user_id_list: [],
    error_in_load_user: null,
    user_data: [],
    validations: {
      name: [VALIDATION_TYPE_REQUIRED],
      jira_issue_reference: [],
    },
  });

  useEffect(() => {
    const data =
      stage_index || stage_index == 0 ? stages[stage_index] : default_data;

    setState({
      ...state,
      data: {
        ...default_data,
        ...data,
      },
    });
  }, [stage_index, varient]);
  useEffect(() => {
    fetchUserData(application_id);
  }, [application_id]);
  useEffect(() => {
    if (state.data.approval) {
      setState((new_state) => ({
        ...new_state,
        validations: {
          selected_roles_pipeline_approval: [VALIDATION_TYPE_REQUIRED],
          selected_users_pipeline_approval: [VALIDATION_TYPE_REQUIRED],
        },
      }));
    }
  }, [state.data.approval]);
  function onChangeHandler(e) {
    var key = e.target.name;
    var value = e.target.value;

    if (key == "approval") {
      value = !state.data.approval;
    }
    if (key == "open_conditions") {
      value = !state.data.open_conditions;
    }
    if (key == "continue_on_disapproval") {
      value = !state.data.continue_on_disapproval;
    }
    if (key == "jira_reference_approver") {
      value = !state.data.jira_reference_approver;
    }
    if (key == "snow_reference_approver") {
      value = !state.data.snow_reference_approver;
    }
    if (key == "send_mail") {
      value = !state.data.send_mail;
    }
    if (key == "approval_questions") {
      value = !state.data.approval_questions;
    }
    if (key == "approval" && !value) {
      RemoveFromArray(
        state.validations.selected_roles_pipeline_approval,
        VALIDATION_TYPE_REQUIRED,
      );
      RemoveFromArray(
        state.validations.selected_users_pipeline_approval,
        VALIDATION_TYPE_REQUIRED,
      );
    }
    setState({
      ...state,
      data: {
        ...state.data,
        [key]: value,
      },
      error: {
        ...state.error,
        [key]: null,
      },
    });
  }

  const getStageRunConditions = () => {
    var current_stage_index = stage_index;
    if (!current_stage_index) {
      current_stage_index = stages.length;
    }
    return getStageRunConditionsAndJiraRefList(
      stages,
      current_stage_index,
      state.data.name,
    );
  };

  function fetchUserData(application_id) {
    var requestInfo = {
      endPoint: GenerateURL(
        { application_id: application_id },
        properties.api.addUserURL,
      ),
      httpMethod: "GET",
      httpHeaders: { "Content-Type": "application/json" },
    };
    if (!application_id) {
      requestInfo.endPoint = GenerateURL({}, properties.api.addPipelineUserURL);
    }
    setState((new_state) => ({
      ...new_state,
      show_loading_icon: true,
      error_in_load_user: null,
    }));
    InvokeApi(
      requestInfo,
      handleUserDataSuccessApiHit,
      handleUserDataFailedApiHit,
    );
  }
  function handleUserDataSuccessApiHit(data) {
    var user_role_list = getUserRoleList(data);
    console.log(user_role_list, "user_role_listuser_role_list");
    if (state.data.selected_roles_pipeline_approval) {
      var user_id_list = getUserListForSelectedRole(
        state.data.selected_roles_pipeline_approval,
        data,
      );
    }
    setState((new_state) => ({
      ...new_state,
      user_id_list: user_id_list && user_id_list.length > 0 ? user_id_list : [],
      roles_list: user_role_list,
      user_data: data,
      show_loading_icon: false,
    }));
  }

  function handleUserDataFailedApiHit(error) {
    let error_msg = showErrorHandlerUpdated(error);
    setState((new_state) => ({
      ...new_state,
      error_in_load_user: error_msg,
      show_loading_icon: false,
    }));
  }

  // var all_user_ids = state.user_id_list.map(item => (item.id))
  function validateAndSaveStage() {
    var validation_result = ValidateDataSet(state.data, state.validations);

    if (validation_result.valid) {
      if (!(stage_index || stage_index == 0)) {
        stages.forEach((stage) => {
          if (state.data.name == stage.name) {
            validation_result.valid = false;
            validation_result.error = { name: ["Stage name already defined"] };
          }
        });
      }
    }
    if (validation_result.valid) {
      var filtered_array = [];
      if (state.user_data && state.user_data.length > 0) {
        state.user_data.forEach((ele) => {
          if (
            state.data.selected_roles_pipeline_approval &&
            state.data.selected_roles_pipeline_approval.length > 0
          ) {
            if (
              state.data.selected_roles_pipeline_approval.includes(
                ele.role_master_id,
              )
            ) {
              console.log(
                state.data.selected_roles_pipeline_approval,
                state.data.selected_users_pipeline_approval,
                "/n changes1111",
                ele,
              );

              filtered_array.push({
                id: ele.user.id,
                email: ele.user.email,
                name: ele.user.name,
                role_master: ele.role_master,
                role_master_id: ele.role_master_id,
              });
            }
          }
        });
      }

      let final_user_arr = [];
      filtered_array.forEach((item) => {
        state.data.selected_users_pipeline_approval.forEach((single_user) => {
          if (single_user === item.id) {
            final_user_arr.push(item);
          }
        });
      });
      console.log(final_user_arr, "final_user_arr");
      if (
        state.data.jira_issue_reference == "" ||
        !state.data.jira_reference_approver
      ) {
        state.data.jira_issue_reference = null;
      }
      if (
        state.data.snow_issue_reference == "" ||
        !state.data.snow_reference_approver
      ) {
        state.data.snow_issue_reference = null;
      }
      if (!state.data.approval_questions) {
        state.data.questionnaires = [];
      }
      var post_data = state.data;
      console.log(state, "fdjskajkfkjsa");

      post_data.approve_user = final_user_arr;
      addOrUpdateStage(post_data, stage_index);
    } else {
      setState({
        ...state,
        error: validation_result.error,
      });
    }
  }

  const addConditionsToStageFunction = (conditions) => {
    if (conditions && conditions.length > 0) {
      let all_conditions_obj = {};

      for (const item of conditions) {
        all_conditions_obj[item.condition_key] = item.condition_value;
      }
      console.log(all_conditions_obj, "conditions___1");
      setState((new_state) => ({
        ...new_state,
        data: {
          ...new_state.data,
          stage_run_condition: all_conditions_obj,
        },
      }));
    } else {
      setState((new_state) => ({
        ...new_state,
        data: {
          ...new_state.data,
          stage_run_condition: {},
        },
      }));
    }
  };
  console.log(
    state.data.stage_run_condition,
    "stage_run_conditionstage_run_condition",
  );
  const addQuestionnaireToStage = (questions_object, updateQuestionFlag) => {
    setState((new_state) => ({
      ...new_state,
      data: { ...new_state.data, questionnaires: [...questions_object] },
    }));
  };

  function getUserRoleList(user_data) {
    var all_roles_list = [];
    var check_if_roles_duplicate = [];
    user_data.map((item) => {
      if (!check_if_roles_duplicate.includes(item.role_master)) {
        check_if_roles_duplicate.push(item.role_master);
        all_roles_list = [
          ...all_roles_list,
          {
            label: item.role_master,
            id: item.role_master_id,
          },
        ];
      }
    });
    return all_roles_list;
  }

  function getUserListForSelectedRole(value, userData) {
    console.log(value, userData, "testing-onewnfjs");

    const filteredUserData = [];

    for (const roleId of value) {
      const matchingUserData = userData.filter(
        (item) => item.role_master_id === roleId,
      );

      if (matchingUserData && matchingUserData.length > 0) {
        for (const user of matchingUserData) {
          // if a matching user data object is found, check if its email is already in filteredUserData
          const existingUserData = filteredUserData.find(
            (item) => item.id === user.user.id,
          );
          if (!existingUserData) {
            // if the email is not already in filteredUserData, push the matching user data object to filteredUserData
            filteredUserData.push({
              label: user.user.name,
              id: user.user.id,
              email: user.user.email,
              role_master: user.role_master,
              role_master_id: user.role_master_id,
            });
          }
        }
      }
    }

    console.log("filteredUserData", filteredUserData);
    return filteredUserData;
  }

  function defaultAllSelected(users) {
    var selected = [];
    users.map((user) => {
      selected.push(user.id);
    });
    return selected;
  }

  function onChangeHandlerForKeyValue(key, value) {
    if (
      key == "selected_users_pipeline_approval" ||
      key == "selected_roles_pipeline_approval"
    ) {
      value.forEach((id, index) => {
        value[index] = Number(id);
      });
    }
    if (key == "selected_roles_pipeline_approval") {
      console.log(value, state.user_data, "value, state.user_data");
      var user_list_for_selected_role = getUserListForSelectedRole(
        value,
        state.user_data,
      );
      console.log(user_list_for_selected_role, "value, state.user_data");
      setState({
        ...state,
        user_id_list: user_list_for_selected_role,
        data: {
          ...state.data,
          [key]: value,
          selected_users_pipeline_approval: defaultAllSelected(
            user_list_for_selected_role,
          ),
        },
        error: {
          ...state.error,
          [key]: null,
        },
      });
    } else {
      setState({
        ...state,
        data: {
          ...state.data,
          [key]: value,
        },
        error: {
          ...state.error,
          [key]: null,
        },
      });
    }
  }

  function getUsersList() {
    if (state.user_id_list) {
      return state.user_id_list;
    } else {
    }
  }
  var jira_ref_key_list = getJiraRefid(pipeline_data);
  const updated_jira_ref_key_and_id_list = [
    ...getStageRunConditions().jira_id_reference_keys,
    ...jira_ref_key_list,
  ];
  var snow_ref_key_list = getSnowRefid(pipeline_data);
  const updated_snow_ref_key_and_id_list = [
    ...getStageRunConditions().snow_id_reference_keys,
    ...snow_ref_key_list,
  ];
  console.log(state, "fsdkaflks");

  return (
    <div className="fill-details-card">
      <div
        className="fill-details-head d-flex align-center space-between"
        style={{ backgroundColor: "rgb(18, 77, 155)", padding: 14 }}
      >
        <p className="color-white">STAGE DETAILS</p>
        <button
          className="btn btn-transparent"
          color="inherit"
          onClick={props.handleClickCloseDialog}
          aria-label="close"
        >
          <span className="ri-close-line color-white" fontSize="large"></span>
        </button>
      </div>

      {state.show_loading_icon && !state.roles_list ? (
        <SkeletonLoadingStageForm />
      ) : (
        <>
          <div className="fill-details-body input-css-controller">
            <Input
              type="text"
              label="Stage Name"
              placeholder="Stage name goes here"
              name="name"
              error={state.error}
              data={state.data}
              onChangeHandler={onChangeHandler}
            />

            <ConditionsDialog
              title="Stage"
              selected_conditions={state.data.stage_run_condition}
              get_run_conditions_function={getStageRunConditions}
              add_conditions_function={addConditionsToStageFunction}
            />

            <div className="approval-req-card mb-20">
              <div className="switch-input-wrapper">
                <Input
                  type="switch"
                  name="approval"
                  label="Approval required to run this Stage ? "
                  onChangeHandler={onChangeHandler}
                  error={state.error}
                  data={state.data}
                />
              </div>

              {state.data.approval ? (
                state.show_loading_icon ? (
                  <div className="light-loading-container">
                    <Loading varient="light" />
                  </div>
                ) : state.error_in_load_user ? (
                  <AlertStrip
                    message={state.error_in_load_user}
                    variant={"error"}
                  />
                ) : (
                  <>
                    <div className="pd-10 input-component-pb-0">
                      <Input
                        type="checkbox"
                        name="selected_roles_pipeline_approval"
                        label="Select User Group"
                        varient="inner_component"
                        subHeading="(You can add multiple)"
                        mandatorySign
                        list={
                          state.roles_list && state.roles_list.length > 0
                            ? state.roles_list
                            : []
                        }
                        data={state.data}
                        error={state.error}
                        onChangeHandler={onChangeHandlerForKeyValue}
                      />
                    </div>
                    {state.data.selected_roles_pipeline_approval &&
                    state.data.selected_roles_pipeline_approval.length > 0 ? (
                      <div className="pd-10 input-component-pb-0">
                        <Input
                          type="checkbox"
                          name="selected_users_pipeline_approval"
                          varient="inner_component"
                          list={
                            state.user_id_list && state.user_id_list.length > 0
                              ? state.user_id_list
                              : []
                          }
                          label="Select Users"
                          onChangeHandler={onChangeHandlerForKeyValue}
                          error={state.error}
                          data={state.data}
                        />
                      </div>
                    ) : null}
                    <div className="pd-10 checkbox-input-wrapper inner-switch-input input-component-pb-0">
                      <Input
                        type="simple-checkbox"
                        name="send_mail"
                        label="Send Email?"
                        onChangeHandler={onChangeHandler}
                        error={state.error}
                        data={state.data}
                      />
                    </div>
                    <div
                      className={`approval-question-card ${classes.rooter12}`}
                      style={{ margin: 10, border: "1px solid #dedede" }}
                    >
                      <div className=" switch-input-wrapper inner-switch-input ">
                        <Input
                          type="switch"
                          name="approval_questions"
                          label="Any questions before approval? "
                          onChangeHandler={onChangeHandler}
                          error={state.error}
                          data={state.data}
                        />
                      </div>
                      {state.data.approval_questions && (
                        <QuestionnaireDialog
                          pipeline_data={pipeline_data}
                          add_questionnaire_to_stage={addQuestionnaireToStage}
                          jira_id_reference_keys_list={
                            getStageRunConditions().jira_id_reference_keys
                          }
                          snow_id_reference_keys_list={
                            getStageRunConditions().snow_id_reference_keys
                          }
                          prev_state={
                            state.data && state.data.questionnaires
                              ? state.data.questionnaires
                              : null
                          }
                        />
                      )}
                    </div>
                    <div className="inner-inner-card" style={{ margin: 10 }}>
                      <div className="switch-input-wrapper inner-switch-input">
                        <Input
                          type="switch"
                          name="jira_reference_approver"
                          label={
                            <div className="label-with-image">
                              <img
                                src="/images/integrations/jira_logo.png"
                                alt=".."
                              />
                              <span>
                                Do you want to push approver name to JIRA?
                              </span>
                            </div>
                          }
                          onChangeHandler={onChangeHandler}
                          error={state.error}
                          data={state.data}
                        />
                      </div>

                      {state.data.jira_reference_approver && (
                        <div className="pd-10">
                          <Input
                            type="select"
                            name="jira_issue_reference"
                            list={updated_jira_ref_key_and_id_list}
                            label="Choose JIRA key"
                            onChangeHandler={onChangeHandler}
                            error={state.error}
                            data={state.data}
                          />
                        </div>
                      )}
                    </div>
                    <div className="inner-inner-card" style={{ margin: 10 }}>
                      <div className="switch-input-wrapper inner-switch-input">
                        <Input
                          type="switch"
                          name="snow_reference_approver"
                          label={
                            <div className="label-with-image">
                              <img
                                src="/integrations/service_now.png"
                                alt=".."
                              />
                              <span>
                                Do you want to push approver name to ServiceNow?
                              </span>
                            </div>
                          }
                          onChangeHandler={onChangeHandler}
                          error={state.error}
                          data={state.data}
                        />
                      </div>

                      {state.data.snow_reference_approver && (
                        <div className="pd-10">
                          <Input
                            type="select"
                            name="snow_issue_reference"
                            list={updated_snow_ref_key_and_id_list}
                            label="Choose ServiceNow key"
                            onChangeHandler={onChangeHandler}
                            error={state.error}
                            data={state.data}
                          />
                        </div>
                      )}
                    </div>
                  </>
                )
              ) : null}
            </div>

            {/* <div className="bg-f8-grey ">
                    <div className='switch-input-wrapper mb-20'>
                        <Input
                            type="switch"
                            name="continue_on_disapproval"
                            label="Continue pipeline on disapproval?"
                            onChangeHandler={onChangeHandler}
                            error={state.error}
                            data={state.data} />
                    </div>
                </div> */}
          </div>

          <div className="fill-details-footer">
            <div
              className="btn btn-add"
              onKeyDown={() => {}}
              onClick={validateAndSaveStage}
              role="button"
              tabIndex={0}
            >
              {varient == EDIT_STAGE ? "UPDATE" : "ADD"}{" "}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

Form.propTypes = {
  ...PropTypes.objectOf(PropTypes.any),
};

const YAMLForm = (props) => {
  const pipeline = props.pipeline;
  const application = props.application;
  const stages = props.stages;
  const updateError = props.updateError;
  const updateStages = props.updateStages;
  const all_project_envs = props.all_project_envs;
  pipeline.stages = stages;
  const yaml = ConvertPipelineObjtoYAML(
    stages,
    application.components,
    all_project_envs,
    application.pipelines,
  );

  function downloadYaml() {
    var data = new Blob([yaml], { type: "text" });
    var csvURL = window.URL.createObjectURL(data);
    var tempLink = document.createElement("a");
    tempLink.href = csvURL;
    tempLink.setAttribute("download", pipeline.name + ".yml");
    tempLink.click();
  }

  function uploadYaml(e) {
    ParseFile(e, onParseComplete, updateError);
  }

  const onParseComplete = (file_data) => {
    const yaml = Base64.decode(file_data.content);

    //var pipeline_services = GetServiceSpecificToPipeline(pipeline.components, application.components,all_project_envs);
    const result = ConvertPipelineYAMLtoObj(
      yaml,
      application.components,
      all_project_envs,
    );

    if (result) {
      updateStages(result.stages);
      if (result.errors && result.errors.length > 0) {
        updateError(result.errors);
      }
    } else {
      updateError("Invalid Yaml");
    }
  };
  return (
    <div
      style={{
        backgroundColor: "#282c34",
        height: "100%",
        borderRadius: "0px 0px 8px 0px",
        position: "relative",
      }}
    >
      <BtnSection>
        <div>
          <button
            className="flaticon-download-button"
            onClick={downloadYaml}
          ></button>
          <div className="yaml-upload">
            <span htmlFor="file-input">
              <span className="flaticon-upload-button"></span>
            </span>

            <input id="file-input" type="file" onChange={uploadYaml} />
          </div>
        </div>
      </BtnSection>
      <SyntaxHighlighter
        id="viewFullScreen"
        language="yaml"
        style={atomOneDark}
      >
        {yaml}
      </SyntaxHighlighter>
    </div>
  );
};

YAMLForm.propTypes = {
  ...PropTypes.objectOf(PropTypes.any),
};

const BtnSection = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: "5px 10px",
  "& div button": {
    border: "none",
    borderRadius: "4px",
    padding: " 3px 5px",
    margin: "0px 2px",
    "&.flaticon-download-button": {
      color: "#0086ff",
    },
    "&.flaticon-upload-button": {
      color: "#0086ff",
    },
  },
});
const useStyles = makeStyles((theme) => ({
  blankSection: {
    height: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  root1: {
    padding: 10,
    "&.grid-cond-temp-2": {
      gridTemplateColumns: "150px 1fr",
      gridGap: "0px 4px",
    },
  },
  rooter12: {
    "& .no-data-msg": {
      fontSize: 12,
      color: "#979797",
      textAlign: "center",
      width: "335px",
      margin: "20px auto",
      minHeight: "80px",
      "& p": {
        marginBottom: "5px",
      },
    },
    "& .switch-input-wrapper": {
      backgroundColor: "#fafafa !important",
    },
  },
}));

const useStylesDialog = makeStyles(() => ({
  dialog_root: {
    "& .MuiDialog-paperScrollPaper": {
      width: "100rem",
      backgroundColor: "#fff;",
    },
    "& .MuiPaper-root": {
      maxWidth: "1000px",
    },
  },
  dialog: {
    width: "100%",
    "& .card-sub-header": {
      backgroundColor: "#fefefe",
      borderBottom: "1px solid #eaeaea",
      padding: "5px",
      "& .heading-with-icon": {
        color: "#484848",
        fontSize: "12px",
      },
    },
    "& .no-issues-added": {
      width: "300px",
      textAlign: "center",
      fontSize: "12px",
      margin: "auto",
      display: "block",
      padding: "20px",
    },
    "& .sq-chip": {
      backgroundColor: "#626262",
      color: "#fff",
      padding: "1px 3px",
      borderRadius: "4px",
      marginLeft: "3px",
    },
  },
  button_class: {
    fontSize: "12px",
    display: "flex",
    marginBottom: "10px",
    alignItems: "center",
    "&:hover": {
      cursor: "pointer",
    },
    "& .small-icon-button": {
      backgroundColor: "#fff",
      marginLeft: "5px",
      border: "none",
      boxShadow: "0.877px 1.798px 8px 0px rgba(0, 0, 0, 0.2)",
      height: "20px",
      width: "20px",
      borderRadius: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#0086ff",
    },
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #C5C5C5",
    fontSize: "14px",
    fontWeight: 400,
    color: "#bfbfbf",
    backgroundColor: "#ffffff",
    padding: "10px 20px",
  },
  cardBody: {
    // padding: '20px 20px',
    "& ul": {
      "&.headerul": {
        "& li": {
          width: "100%",
          textAlign: "center",
          fontSize: "12px",
          borderBottom: "1px solid #a3a3a3",
          color: "#000",
          "&.active": {
            color: "#000",
            borderBottom: "2px solid #124D9B",
          },
        },
      },
    },
  },
  card_shadow: {
    boxShadow:
      " 0 3px 4px 0 rgba(0, 0, 0, 0.1), 0 4px 8px 0 rgba(0, 0, 0, 0.1)",
    color: "#6e6e6e",
    borderRadius: "25px",
    fontSize: "13px",
    width: "450px",
    height: "50px",
    padding: "15px",
    marginTop: "25px",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button_code: {
    backgroundColor: "#007eff",
    border: "none",
    color: "white",
    padding: "11px 32px",
    textAlign: "center",
    textDecoration: "none",
    display: "inline-block",
    fontSize: "11px",
    margin: "4px 2px",
    cursor: "pointer",
    float: "right",
    width: "110px",
    height: "38px",
  },
  title_block: {
    borderBottom: "1px solid #a09e9e",
    padding: "15px",
    backgroundColor: "#f4f4f4",
    display: "flex",
    justifyContent: "space-between",
  },
  condition_block: {
    display: "flex",
    alignItems: "center",
    borderBottom: "1px solid #a09e9e",
    borderTop: "1px solid #a09e9e",
    padding: "8px",
    backgroundColor: "#f4f4f4",
    justifyContent: "space-between",
  },
}));
