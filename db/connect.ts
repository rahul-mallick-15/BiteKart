import postgres from "postgres";

export const connectDB = (url: string) => {
    return postgres(url,{ssl:true});
}
