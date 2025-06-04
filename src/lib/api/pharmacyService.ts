import axiosClient from '../axiosClient';

export interface Pharmacy {
  id: string;
  machinhanh: string;
  thanhpho: string;
  quan: string;
  phuong: string;
  tenduong: string;
  diachicuthe: string;
  diachi: string;
}

export interface PharmacyResponse {
  statusCode: number;
  message: string;
  timestamp: string;
  path: string;
  data: Pharmacy[];
}
export interface PharmacyResponseOne {
  statusCode: number;
  message: string;
  timestamp: string;
  path: string;
  data: Pharmacy;
}

// Helper function to clean up location names
const cleanLocationName = (name: string): string => {
  // Remove common prefixes
  const prefixesToRemove = ['TP.', 'Tỉnh', 'Thành phố', 'Quận', 'Q.', 'Huyện', 'H.', 'Phường', 'P.', 'Xã', 'X.'];
  let cleanedName = name;
  
  prefixesToRemove.forEach(prefix => {
    cleanedName = cleanedName.replace(new RegExp(`^${prefix}\\s*`, 'i'), '');
  });
  
  return cleanedName.trim();
};

export const findPharmacyByProvinces = async (tinhThanh: string, quanHuyen: string = ' '): Promise<Pharmacy[]> => {
  try {
    const cleanedTinhThanh = cleanLocationName(tinhThanh);
    const cleanedQuanHuyen = quanHuyen === ' ' ? quanHuyen : cleanLocationName(quanHuyen);
    
    const response = await axiosClient.get<PharmacyResponse>(
      `/pharmacy/findPharmacyByProvinces/${encodeURIComponent(cleanedTinhThanh)}/${encodeURIComponent(cleanedQuanHuyen)}`
    );
    if (response.data.statusCode === 200) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('Error in findPharmacyByProvinces:', error);
    return [];
  }
}; 
export const findOne = async (code: string ): Promise<Pharmacy | null> => {
  try {
    
    const response = await axiosClient.get<PharmacyResponseOne>(
      `/pharmacy/findOnePharmacy/${encodeURIComponent(code)}`
    );
      return response.data.data;
    
  } catch (error) {
    console.error('Error in findPharmacyByProvinces:', error);
    return null;
  }
}; 