export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export const successResponse = <T>(
  message: string,
  data: T,
): ApiSuccessResponse<T> => {
  return {
    success: true,
    message,
    data,
  };
};
