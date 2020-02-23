import LoginDetails from "../models/LoginDetails";

class ApiClient {
    private baseUrl: string
    authenticationCallback: (newStatus: boolean) => void

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
        var loginPath = "/api/auth/login"

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
        var statusPath = "/api/auth/status"
        try {   
            var response = await this.getRequest(statusPath)
            return (response.status === 200)
        } catch {
            return false
        }
    }

    async getRequest(relativePath: string): Promise<Response> {
        return fetch(`${this.baseUrl}${relativePath}`, {
            credentials: 'include'
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

export default ApiClient