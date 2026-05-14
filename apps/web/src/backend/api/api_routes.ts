import { ENV } from "@/src/config/config.env";

export default class API {
    static BASE_URL = ENV.NEXT_PUBLIC_BACKEND_URL;
    static API_URL = this.BASE_URL + "/api/v1";
    static SIGNIN_URL = `${this.API_URL}/auth/sign-in`;
}
