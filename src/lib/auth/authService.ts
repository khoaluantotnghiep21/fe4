import axiosClient from "@/lib/axiosClient";

export const AuthService = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  detailEsurvey: async (): Promise<any> => {
    return await axiosClient.get(
      `lccus/ecom-prod/store-front/v2/promotion-flash-sale`
    );
  },
};
