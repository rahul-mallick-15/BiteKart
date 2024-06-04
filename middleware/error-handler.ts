import {CustomAPIError} from "../errors/custom-error";

const errorHandlerMiddleware = (err: any, req: any, res: any, next: any) => {
  if (err instanceof CustomAPIError) {
    return res.status(err.statusCode).json({ msg: err.message });
  }
  console.log(err);
  
  return res
    .status(500)
    .json({ msg: "Something went wrong, please try again" });
};

export default errorHandlerMiddleware;
