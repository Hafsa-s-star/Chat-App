import jwt from "jsonwebtoken";

export function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not configured");
    }
    return secret;
}

export function authenticateToken(req,res,next){
    const token = req.cookies?.token;

    if(!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try{
        req.user = jwt.verify(token, getJwtSecret())
        next()
    }catch(err){
        if (err.message === "JWT_SECRET is not configured") {
            return next(err);
        }
        res.status(401).json({
            message:"Invalid Token",
        })
    }

}
export function requireAdmin(req,res,next){
    if( req.user.role !== "admin"){
        return res.status(403).json({
            message:"Forbidden"
        })
    }
    next()
}
