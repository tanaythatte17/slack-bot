import jwt from "jsonwebtoken";

export const generateToken = (payload: object, res: any) => {
    const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "5d" });
    console.log("Generated JWT token:", token);
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie("jwt", token, {
        maxAge: 5 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
    });
    return token;
}