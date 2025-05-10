import axiosClient from "@/lib/axiosClient";

export const AuthService = {
    detailEsurvey: async (): Promise<any> => {
        return await axiosClient.get(`lccus/ecom-prod/store-front/v2/promotion-flash-sale`);
    },
}

