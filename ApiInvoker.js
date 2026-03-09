import { GetAuth, GetPermitedURLs, GetPermitedURLsPromisified, IsSuperUser } from "./security";
import { RegenerateRefreshAndAccessToken, IsAuthenticated, IsRefreshTokenValid } from "../util/security"
import { RemoveFromArray } from "./util";
import { UpdateClusterDataForNavigation, UpdateUserDataForNavigation } from "./GlobalVars";
import { createBrowserHistory } from 'history';

function validateTokenAndInvokePostStreamAPI(url, data, onEvent, onDone, onError, opts = {}) {
  const call = () => invokePostStreamRequest(url, data, onEvent, onDone, onError, opts);

  if (!IsAuthenticated()) {
    if (IsRefreshTokenValid()) {
      RegenerateRefreshAndAccessToken(call, onError);
    } else {
      onError("Session expired. Login again");
    }
  } else {
    call();
  }
}

export function PostDataStream(url, data, onEvent, onDone, onError, doNotValidateToken, opts = {}) {
  if (doNotValidateToken) {
    return invokePostStreamRequest(url, data, onEvent, onDone, onError, opts);
  }
  return validateTokenAndInvokePostStreamAPI(url, data, onEvent, onDone, onError, opts);
}

async function invokePostStreamRequest(url, data, onEvent, onDone, onError, opts = {}) {
  const auth = GetAuth();
  const controller = opts.controller || new AbortController();

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
        "Authorization": auth ? `Bearer ${auth.access}` : null
      },
      body: JSON.stringify(data),
      signal: controller.signal
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      onError(errText || `HTTP error ${res.status}`);
      return { abort: () => controller.abort() };
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");

    // Important: SSE frames can be split across chunks, so keep a buffer.
    let buffer = "";
    let aggregated = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE events are separated by a blank line
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || ""; // remainder stays in buffer

      for (const evt of parts) {
        const lines = evt.split("\n");
        for (const line of lines) {
          if (line.startsWith("data:")) {
            const dataPart = line.slice(5).trim();
            if (!dataPart) continue;
            if (dataPart === "[DONE]") continue;

            // If your backend sends json in data:, parse here. Otherwise treat as token/text.
            // const payload = JSON.parse(dataPart);
            aggregated += dataPart;
            onEvent({ delta: dataPart, aggregated });
          }
        }
      }
    }

    onDone({ aggregated });
    return { abort: () => controller.abort() };
  } catch (e) {
    if (e?.name === "AbortError") return { abort: () => controller.abort() };
    onError(e?.message || "Stream failed");
    return { abort: () => controller.abort() };
  }
}

function InvokeApi(requestInfo, callBackFunction, errorCallBackFunction, doNotValidateToken, parseText) {
  console.log(requestInfo, "requestInfo___")
  if (doNotValidateToken) {
    invokeGetRequest(requestInfo, callBackFunction, errorCallBackFunction, parseText);
  } else {
    validateTokenAndInvokeGetAPI(requestInfo, callBackFunction, errorCallBackFunction, parseText);
  }
}

function validateTokenAndInvokeGetAPI(requestInfo, callBackFunction, errorCallBackFunction, parseText) {
  const callBackFunctionLocal = () => {
    invokeGetRequest(requestInfo, callBackFunction, errorCallBackFunction, parseText)
  }

  if (!IsAuthenticated()) {
    if (IsRefreshTokenValid()) {
      RegenerateRefreshAndAccessToken(callBackFunctionLocal, errorCallBackFunction);
    } else {
      errorCallBackFunction("Session expired. Login again");
    }
  } else {
    invokeGetRequest(requestInfo, callBackFunction, errorCallBackFunction, parseText)
  }
}

function validateTokenAndInvokePostAPI(url, data, callBackFunction, errorCallBackFunction, doNotFetchPermission) {
  console.log("responsefjsdjfkjskafjs", doNotFetchPermission)
  const callBackFunctionLocal = () => {
    invokePostRequest(url, data, callBackFunction, errorCallBackFunction);
  }

  if (!IsAuthenticated()) {
    if (IsRefreshTokenValid()) {
      RegenerateRefreshAndAccessToken(callBackFunctionLocal, errorCallBackFunction);
    } else {
      errorCallBackFunction("Session expired. Login again");
    }
  } else {
    console.log("responsefjsdjfkjskafjs", doNotFetchPermission)
    invokePostRequest(url, data, callBackFunction, errorCallBackFunction, doNotFetchPermission);
  }
}

function validateTokenAndInvokeDeleteAPI(url, data, callBackFunction, errorCallBackFunction) {
  const callBackFunctionLocal = () => {
    invokeDeleteRequest(url, data, callBackFunction, errorCallBackFunction);
  }

  if (!IsAuthenticated()) {
    if (IsRefreshTokenValid()) {
      RegenerateRefreshAndAccessToken(callBackFunctionLocal, errorCallBackFunction);
    } else {
      errorCallBackFunction("Session expired. Login again");
    }
  } else {
    invokeDeleteRequest(url, data, callBackFunction, errorCallBackFunction)
  }
}

export const PostData = (url, data, callBackFunction, errorCallBackFunction, doNotValidateToken, doNotFetchPermission = true) => {
  console.log("responsefjsdjfkjskafjs", doNotFetchPermission, doNotValidateToken)
  if (doNotValidateToken) {
    invokePostRequest(url, data, callBackFunction, errorCallBackFunction, true);
  } else {
    validateTokenAndInvokePostAPI(url, data, callBackFunction, errorCallBackFunction, doNotFetchPermission);
  }
}
export const DeleteData = (url, data, callBackFunction, errorCallBackFunction, doNotValidateToken) => {
  if (doNotValidateToken) {
    invokeDeleteRequest(url, data, callBackFunction, errorCallBackFunction, true);
  } else {
    validateTokenAndInvokeDeleteAPI(url, data, callBackFunction, errorCallBackFunction);
  }
}

function invokeGetRequest(requestInfo, callBackFunction, errorCallBackFunction, parseText) {
  var status = null;
  var bearerToken = "Bearer " + GetAuth().access;

  var fetchOptions = {
    method: requestInfo.httpMethod,
    headers: { ...requestInfo.httpHeaders, "Authorization": bearerToken },
  };

  console.log(requestInfo, 'requestInfo_212332232')
  fetch(requestInfo.endPoint, fetchOptions)
    .then(response => {
      // console.log(response.text(),'sbvjshbvhjsbvhdbhfd');
      console.log(parseText, 'pt_001')
      const contentType = response.headers.get("content-type")
      console.log(contentType, 'content_type_030243');
      if (contentType === 'application/zip' || contentType === 'application/zip; charset=UTF-8') {
        return response.blob();
      }
      status = response.status;

      var response_json = parseText ? response.text() : response.json();
      return response_json;
    })
    .then((data) => {
      console.log(data, status, ApiIsUnSubsribed(requestInfo.endPoint), "sbvjshbvhjsbvhdbhfd")
      if (!ApiIsUnSubsribed(requestInfo.endPoint)) {
        console.log(data, "sbvjshbvhjsbvhdbhfd", status)
        if (data.type === 'application/zip') {
          callBackFunction(data);
        }
        else if (status === 200) {
          callBackFunction(data);
        }
        else if (status == 403) {
          const error_status = resolveErrorStatus(status, data);
          errorCallBackFunction({ error: error_status, status: status }, status);
        }
        else {
          var error_status = resolveErrorStatus(status, data);
          errorCallBackFunction(error_status, status);
        }
      }
    })
    .catch((exception) => {
      console.log(exception, "fdsafjkasjkfask");
      handleException();
      if (typeof errorCallBackFunction === 'function') {
        errorCallBackFunction(exception);
      }
    });
}

function resolveErrorStatus(status, data) {
  let genericMessage = "Server is currently unavailable. Please try again later."
  switch (status) {
    case 401:
      return data.detail ?? genericMessage;
    case 500:
      return data.detail ?? genericMessage;
    case 501:
      return data.error ?? genericMessage;
    case 404:
      return "404: The requested resource was not found on this server.";
    case 405:
      return data.detail ?? genericMessage;
    case 403:
      return data.detail ?? "You do not have permission to perform this action.";
    case 400:
      if (data.non_field_errors) {
        return data.non_field_errors[0]
      }
      return data ?? genericMessage;
    default:
      return data ?? genericMessage;
  }
}

// function invokePostRequest(url, data, callBackFunction, errorCallBackFunction, doNotRefreshPermission) {
//   console.log(url, data, callBackFunction, errorCallBackFunction, doNotRefreshPermission,'post_api_00psd')
//   var status = null;
//   var auth = GetAuth();
//   var fetchOptions = {
//     method: "POST",
//     headers: { "Content-Type": "application/json", "Authorization": auth ? "Bearer " + GetAuth().access : null },
//     body: JSON.stringify(data)
//   };
//   console.log(url, fetchOptions,"fdskfdasa")
//   fetch(url, fetchOptions)
//     .then(response => {
//       status = response.status;
//       var response_json = response.json();
//       console.log(status, response_json,"fkldsafs, datfklsdkla")
//       return response_json;
//     })
//     .then((data) => {
//       if (!ApiIsUnSubsribed(url)) {
//         if ((status == 200) || (status == 201) || (status == 204)) {
//           if (!doNotRefreshPermission) {
//             GetPermitedURLsPromisified()
//               .then(() => callBackFunction(data))  // only call back when permissions successfully fetched 
//               .catch((error) => { errorCallBackFunction(error) })
//             if (IsSuperUser()) {
//               UpdateClusterDataForNavigation();
//             } else {
//               UpdateUserDataForNavigation();
//             }
//           }
//           else {
//             console.log(status, data,"fkldsafs, datfklsdkla")
//             callBackFunction(data);
//           }
//         }
//         else if (status == 403) {
//           const error_status = resolveErrorStatus(status, data);
//           errorCallBackFunction({ error: error_status, status: status });
//         }else if (status == 404) {
//           console.log(status, data,"fkldsafs, datfklsdkla")
//           const error_status = resolveErrorStatus(status, data);
//           errorCallBackFunction({ error: error_status, status: status });
//         }
//         else {
//           console.log(status, data,"fkldsafs, datfklsdkla")
//           var error_status = resolveErrorStatus(status, data);
//           handleErrorResponse();
//           errorCallBackFunction(error_status);
//         }
//       }
//     })
//     .catch((exception) => {
//       console.log(exception,"exceptionexceptionexception")
//       handleException();
//       // errorCallBackFunction(exception,true);
//     });
// }

const pendingPostRequests = new Set();

function invokePostRequest(url, data, callBackFunction, errorCallBackFunction, doNotRefreshPermission) {
  const requestSignature = `${url}|${JSON.stringify(data)}`;

  if (pendingPostRequests.has(requestSignature)) {
    console.warn("Duplicate request prevented:", requestSignature);
    return;
  }

  pendingPostRequests.add(requestSignature);

  console.log("responsefjsdjfkjskafjs", doNotRefreshPermission)
  console.log(url, data, callBackFunction, errorCallBackFunction, doNotRefreshPermission, 'post_api_00psd');

  let status = null;
  const auth = GetAuth();

  const fetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": auth ? "Bearer " + auth.access : null
    },
    body: JSON.stringify(data)
  };

  console.log(url, fetchOptions, "fdskfdasa");

  fetch(url, fetchOptions)
    .then(async (response) => {
      status = response.status;
      let responseData;

      try {
        // Safely parse JSON only if content-type is JSON
        const contentType = response.headers.get("Content-Type");
        if (contentType && contentType.includes("application/json")) {
          responseData = await response.json();
        } else {
          responseData = await response.text(); // fallback to text
        }
      } catch (err) {
        console.error("JSON parse error:", err);
        responseData = { error: "Invalid response format" };
      }

      if (!ApiIsUnSubsribed(url)) {
        if ([200, 201, 204].includes(status)) {
          if (!doNotRefreshPermission) {
            GetPermitedURLsPromisified()
              .then(() => callBackFunction(responseData))
              .catch(error => errorCallBackFunction(error));

            if (IsSuperUser()) {
              UpdateClusterDataForNavigation();
            } else {
              UpdateUserDataForNavigation();
            }
          } else {
            // Wait for next tick so any sync UI updates complete first, preventing double clicks when UI states change across React renders
            setTimeout(() => callBackFunction(responseData), 0);
          }
        } else if ([403, 404].includes(status)) {
          console.log(status, responseData, "fkjjdkfjsdfjsdajfsfkjsafs")
          const error_status = resolveErrorStatus(status, responseData);
          errorCallBackFunction(error_status);
        } else {
          const error_status = resolveErrorStatus(status, responseData);
          handleErrorResponse();
          errorCallBackFunction(error_status);
        }
      }
    })
    .catch((exception) => {
      console.error("Fetch exception:", exception);
      handleException();
      // Optional: errorCallBackFunction(exception, true);
    }).finally(() => {
      // Always remove from pending requests when request finishes (success or fail)
      pendingPostRequests.delete(requestSignature);
    });
}


function invokeDeleteRequest(url, data, callBackFunction, errorCallBackFunction, doNotRefreshPermission) {
  var status = null;
  var auth = GetAuth();

  var fetchOptions = {
    method: "delete",
    headers: { "Content-Type": "application/json", "Authorization": auth ? "Bearer " + GetAuth().access : null },
    body: JSON.stringify(data)
  };


  fetch(url, fetchOptions)
    .then(response => {
      status = response.status;
      var response_json = response.json();
      return response_json;
    })
    .then((data) => {
      if (!ApiIsUnSubsribed(url)) {
        if (status == 200) {
          if (!doNotRefreshPermission) {
            // GetPermitedURLs();
            if (IsSuperUser()) {
              UpdateClusterDataForNavigation();
            } else {
              UpdateUserDataForNavigation();
            }
          }
          callBackFunction(data);
        }
        else if (status == 403) {
          const error_status = resolveErrorStatus(status, data);
          errorCallBackFunction({ error: error_status, status: status });
        }
        else {
          var error_status = resolveErrorStatus(status, data);
          handleErrorResponse();
          errorCallBackFunction(error_status);
        }
      }
    }).catch((exception) => {
      console.log(exception, "fdsafjkasjkfask");
      handleException();
      // errorCallBackFunction(exception,true);
    });

}

export function UnsubscribeToApi(url) {
  var unsubscribed_api_ist = (window.localStorage.getItem("unsubscribed_api_ist"));
  unsubscribed_api_ist = unsubscribed_api_ist ? unsubscribed_api_ist.split(",") : [];

  if (!unsubscribed_api_ist.includes(url)) {
    unsubscribed_api_ist.push(url);
  }
  window.localStorage.setItem("unsubscribed_api_ist", unsubscribed_api_ist.toString());
}

export function SubscribeToApi(url) {
  var unsubscribed_api_ist = (window.localStorage.getItem("unsubscribed_api_ist"));
  unsubscribed_api_ist = unsubscribed_api_ist ? unsubscribed_api_ist.split(",") : [];

  if (unsubscribed_api_ist) {
    RemoveFromArray(unsubscribed_api_ist, url);
  }
  window.localStorage.setItem("unsubscribed_api_ist", unsubscribed_api_ist.toString());
}

export function ApiIsUnSubsribed(url) {
  var unsubscribed_api_ist = window.localStorage.getItem("unsubscribed_api_ist");
  unsubscribed_api_ist = unsubscribed_api_ist ? unsubscribed_api_ist.split(",") : [];

  return unsubscribed_api_ist.includes(url);
}

var handleErrorResponse = () => { return null };
var handleException = () => { return null };
var handlePermissionNotFoundResponse = () => {
  const history = createBrowserHistory();
  history.go("/permission-not-found")

}
export function SetHandleError(handle_error_callback) {
  handleErrorResponse = handle_error_callback;
}

export default InvokeApi;
