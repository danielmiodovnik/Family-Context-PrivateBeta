import LoginDetails from "../models/LoginDetails";
import PersonDetails from "../models/PersonDetails";
import ServiceInvolvementDetailsSummary from "../models/ServiceInvolvementDetailsSummary";
import ServiceDetail from "../models/ServiceDetail";
import SearchDetails from "../models/SearchDetails";
import PersonRelationshipDetails from "../models/PersonRelationshipDetails";

class ApiClient {
  private baseUrl: string
  private authenticationCallback: (newStatus: boolean) => void

  constructor(baseUrl: string, authenticationCallback: (newStatus: boolean) => void) {
    this.baseUrl = baseUrl;
    this.authenticationCallback = authenticationCallback;
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /*
   * The login method cannot use the 'fetch' api because it does not allow cross origin requests to set
   * cookies. We use the XMLHttpRequest for logging in to get round this limitation.
   */
  async login(loginDetails: LoginDetails): Promise<boolean> {
    var loginPath = "/auth/login"

    return new Promise((resolve, reject) => {
      var request = new XMLHttpRequest();

      request.open('POST', `${this.baseUrl}${loginPath}`, true);

      request.withCredentials = true;
      request.setRequestHeader('Content-Type', 'application/json');

      request.onload = (event) => {
        var response = JSON.parse(request.response);
        var wasAuthenticationSuccessful = response && response.status === "authenticated";
        this.authenticationCallback(wasAuthenticationSuccessful);
        resolve(wasAuthenticationSuccessful);
      }

      request.onerror = () => {
        reject()
      }

      request.send(JSON.stringify(loginDetails))
    })
  }

  async isLoggedIn(): Promise<boolean> {
    var statusPath = "/auth/status"
    try {
      var response = await this.getRequest(statusPath)
      return (response.status === 200)
    } catch {
      return false
    }
  }

  async getPerson(personId: string): Promise<RequestResult<PersonDetails>> {
    let personDetailsPath = "/person/detail/" + personId;
    let response = await this.getRequest(personDetailsPath);

    let result: RequestResult<PersonDetails> = {
      statusCode: response.status,
      success: response.ok
    }

    if (response.ok) {
      result.data = await response.json();
    }

    return result;

  }

  async getServiceSummaries(personId: string): Promise<RequestResult<ServiceInvolvementDetailsSummary[]>> {
    let personDetailsPath = "/person/detail/" + personId + "/service";
    let response = await this.getRequest(personDetailsPath);

    return {
      statusCode: response.status,
      success: response.ok,
      data: await response.json()
    };
  }

  async getServiceDetail(personId: string, serviceId: string): Promise<RequestResult<ServiceDetail>> {
    let serviceDetailsPath = "/person/detail/" + personId + "/service/" + serviceId;
    let response = await this.getRequest(serviceDetailsPath);
    let responseObject = {
      "data": {
        "contact": {
          "email": "officer@police.uk",
          "name": "P C Jones",
          "phone": "999"
        },
        "offences": [
          {
            "dateOfOffence": "2015-10-01",
            "natureOfInvolvement": "Offender",
            "typeOfOffence": "AntiSocial Behaviour"
          },
          {
            "dateOfOffence": "2016-10-01",
            "natureOfInvolvement": "Offender",
            "typeOfOffence": "Possession of drugs"
          },
          {
            "dateOfOffence": "2017-10-01",
            "natureOfInvolvement": "Offender",
            "typeOfOffence": "AntiSocial Behaviour"
          }
        ],
        "policeStation": "Area A",
        "serviceInvolvement": "yes"
      },
      "schema": {
        "properties": {
          "contact": {
            "description": "Generic object describing the contact information",
            "properties": {
              "email": {
                "type": "string",
                "x-item-seq": 2
              },
              "name": {
                "type": "string",
                "x-item-seq": 1
              },
              "phone": {
                "type": "string",
                "x-item-seq": 3
              },
              "role": {
                "type": "string",
                "x-item-seq": 4
              }
            },
            "type": "object",
            "x-item-seq": 2,
            "x-ref": "http://www.sfdl.org.uk/schemas/fc/0.0.1#Contact"
          },
          "offences": {
            "items": {
              "properties": {
                "dateOfOffence": {
                  "format": "date",
                  "type": "string",
                  "x-item-seq": 1
                },
                "natureOfInvolvement": {
                  "type": "string",
                  "x-item-seq": 3
                },
                "typeOfOffence": {
                  "type": "string",
                  "x-item-seq": 2
                }
              },
              "title": "Offence",
              "type": "object",
              "x-ref": "http://www.sfdl.org.uk/schemas/fc/0.0.1#OffenceSummary"
            },
            "title": "Recent offence",
            "type": "array",
            "x-item-seq": 4
          },
          "policeStation": {
            "title": "Police station",
            "type": "string",
            "x-item-seq": 3
          },
          "serviceInvolvement": {
            "pattern": "[yes|no]",
            "title": "Service involvement",
            "type": "string",
            "x-item-seq": 1
          }
        },
        "type": "object",
        "x-ref": "http://www.sfdl.org.uk/schemas/fc/0.0.1#Police"
      },
      "summary": {
        "coverageEndDate": "2020-01-06",
        "coverageStartDate": "2000-01-01",
        "id": "Police",
        "lastSynchronised": "2020-01-06T10:00",
        "title": "Police"
      }
    }
    let stringy = JSON.stringify(responseObject);
    let jsonString = (await response.text()).replace(/x-ref/g, "xRef").replace(/x-item-seq/g, "xItemSeq");

    return {
      statusCode: response.status,
      success: response.ok,
      data: JSON.parse(jsonString)
    };
  }

  async isRelatedIndividualsSupported(personId: string): Promise<RequestResult<boolean>> {
    let relatedIndividualsPath = "/person/related/" + personId;
    let response = await this.headRequest(relatedIndividualsPath);

    return {
        statusCode: response.status,
        success: response.ok || response.status === 501,
        data: response.status === 200,
    }
}

async getRelatedIndividuals(personId: string): Promise<RequestResult<PersonRelationshipDetails[]>> {
    let relatedIndividualsPath = "/person/related/" + personId;
    let response = await this.headRequest(relatedIndividualsPath);

    return {
        statusCode: response.status,
        success: response.ok,
        data: await response.json()
    }
}

  async searchPerson(search: SearchDetails): Promise<RequestResult<PersonDetails[]>> {
    let searchPath = "/search/person";
    let response = await this.postJsonRequest(searchPath, JSON.stringify(search))

    return {
      statusCode: response.status,
      success: response.ok,
      data: await response.json()
    }
  }

  async postJsonRequest(relativePath: string, body: string): Promise<Response> {
    return fetch(`${this.baseUrl}${relativePath}`, {
      method: "POST",
      credentials: 'include',
      body: body,
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(response => {
      if (response.status === 401) {
        this.authenticationCallback(false);
      }
      return response;
    });
  }

  async getRequest(relativePath: string): Promise<Response> {
    return fetch(`${this.baseUrl}${relativePath}`, {
      credentials: 'include'
    }).then(response => {
      if (response.status === 401) {
        this.authenticationCallback(false);
      }
      return response;
    });
  }

    async headRequest(relativePath: string): Promise<Response> {
        return fetch(`${this.baseUrl}${relativePath}`, {
            credentials: 'include',
            method: 'HEAD'
        }).then(response =>
            {
                if (response.status === 401)
                {
                    this.authenticationCallback(false);
                }
                return response;
            });
    }
}

export interface RequestResult<T> {
  statusCode: number,
  data?: T,
  success: boolean,
  errorMessage?: string
}

export default ApiClient