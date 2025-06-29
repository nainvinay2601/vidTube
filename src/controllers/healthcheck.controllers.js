import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";


// const healthcheck  = async ( req, res)=>{
// try {
//     res.status(200).json
// } catch (error) {

// }
// we have to return multiple multiple responses so try and catch will make our code very clumpsy so the first use case of util function asyncHandler and all is here
// }

// PROFESSIONAL APPROACH FOR THIS

const healthcheck = asyncHandler(async (req, res) => {
  return (
    res
      .status(200)
      // .json({message:"Test Ok"}) -> this is not a professional way of sending a response , so to handle it professionally we use the ApiResponse utility function for better response that return us status message error
      .json(new ApiResponse(200, "OK", "Health Check Passed"))
  );
});

export { healthcheck };
