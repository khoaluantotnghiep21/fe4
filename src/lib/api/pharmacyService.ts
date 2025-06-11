import axiosClient from '../axiosClient';

// Interface cho nhân viên nhà thuốc
export interface PharmacyEmployee {
  id: string;
  idnhanvien: string;
  idnhathuoc: string;
  hoten?: string;
  sodienthoai?: string;
  email?: string;
  diachi?: string;
  gioitinh?: string;
  ngaysinh?: string;
}

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

export interface PharmacyEmployeeResponse {
  statusCode: number;
  message: string;
  timestamp: string;
  path: string;
  data: PharmacyEmployee[];
}

export interface PharmacyResponseOne {
  statusCode: number;
  message: string;
  timestamp: string;
  path: string;
  data: Pharmacy;
}

export interface PharmacyEmployeeResponseOne {
  statusCode: number;
  message: string;
  timestamp: string;
  path: string;
  data: PharmacyEmployee;
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
    console.error('Error in findOne:', error);
    return null;
  }
};

export const getAllPharmacies = async (): Promise<Pharmacy[]> => {
  try {
    const response = await axiosClient.get<PharmacyResponse>(
      '/pharmacy/getAllPharmacy'
    );
    
    if (response.data.statusCode === 200) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('Error in getAllPharmacies:', error);
    return [];
  }
};

export interface CreatePharmacyData {
  thanhpho: string;
  quan: string;
  phuong: string;
  tenduong: string;
  diachicuthe: string;
}

export const createNewPharmacy = async (pharmacyData: CreatePharmacyData): Promise<Pharmacy | null> => {
  try {
    const response = await axiosClient.post<PharmacyResponseOne>(
      '/pharmacy/createNewPharmacy',
      pharmacyData
    );
    
    if (response.data.statusCode === 201 || response.data.statusCode === 200) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error('Error in createNewPharmacy:', error);
    return null;
  }
};

export interface UpdatePharmacyData {
  thanhpho: string;
  quan: string;
  phuong: string;
  tenduong: string;
  diachicuthe: string;
}

export const updatePharmacy = async (machinhanh: string, pharmacyData: UpdatePharmacyData): Promise<Pharmacy | null> => {
  try {
    const response = await axiosClient.put<PharmacyResponseOne>(
      `/pharmacy/updatePharmacy/${encodeURIComponent(machinhanh)}`,
      pharmacyData
    );
    
    if (response.data.statusCode === 200) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error('Error in updatePharmacy:', error);
    return null;
  }
};

export const deletePharmacy = async (machinhanh: string): Promise<boolean> => {
  try {
    if (!machinhanh) {
      console.error('Error in deletePharmacy: machinhanh is empty or undefined');
      return false;
    }

    const response = await axiosClient.delete(
      `/pharmacy/deletePharmacy/${encodeURIComponent(machinhanh)}`
    );
    
    if (response.data.statusCode !== 200) {
      console.error('Error in deletePharmacy: Server returned status code', response.data.statusCode, response.data.message);
    }
    
    return response.data.statusCode === 200;
  } catch (error) {
    console.error('Error in deletePharmacy:', error);
    return false;
  }
};

// API cho nhân viên nhà thuốc

/**
 * Lấy danh sách nhân viên của một nhà thuốc
 * @param idnhathuoc - Mã nhà thuốc
 * @returns Danh sách nhân viên
 */
export const getListEmployeesInPharmacy = async (idnhathuoc: string): Promise<PharmacyEmployee[]> => {
  try {
    if (!idnhathuoc) {
      console.error('Error in getListEmployees: idnhathuoc is empty or undefined');
      return [];
    }

    const response = await axiosClient.get<PharmacyEmployeeResponse>(
      `/pharmacy-employees/getListEmployeesInPharmacy/${encodeURIComponent(idnhathuoc)}`
    );
    
    if (response.data.statusCode === 200) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('Error in getListEmployees:', error);
    return [];
  }
};

/**
 * Thêm nhân viên vào nhà thuốc
 * @param data - Thông tin về mối quan hệ nhân viên-nhà thuốc
 * @returns Thông tin nhân viên đã thêm hoặc null nếu thất bại
 */
export interface AddEmployeeData {
  idnhathuoc: string;
  idnhanvien: string;
}

export const addEmployee = async (data: AddEmployeeData): Promise<PharmacyEmployee | null> => {
  try {
    const response = await axiosClient.post<PharmacyEmployeeResponseOne>(
      '/pharmacy-employees/addEmployee',
      data
    );
    
    if (response.data.statusCode === 201 || response.data.statusCode === 200) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error('Error in addEmployee:', error);
    return null;
  }
};

/**
 * Xóa nhân viên khỏi nhà thuốc
 * @param data - Thông tin về mối quan hệ nhân viên-nhà thuốc cần xóa
 * @returns true nếu xóa thành công, false nếu thất bại
 */
export interface RemoveEmployeeData {
  idnhathuoc: string;
  idnhanvien: string;
}

export const removeEmployee = async (data: RemoveEmployeeData): Promise<boolean> => {
  try {
    const response = await axiosClient.delete(
      '/pharmacy-employees/removeEmployee',
      {
        data: data
      }
    );
    
    if (response.data.statusCode === 200) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error in removeEmployee:', error);
    return false;
  }
};

export const getAllEmployee = async (): Promise<PharmacyEmployee[]> => {
  try {
    const response = await axiosClient.get<PharmacyEmployeeResponse>(
      '/pharmacy-employees/getListEmployee'
    );
    
    if (response.data.statusCode === 200) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('Error in getAllEmployee:', error);
    return [];
  }
};


