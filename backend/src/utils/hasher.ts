import bcrypt from "bcrypt";

export async function hashPassword(password: string) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
}

export async function isMatch(password: string, hashedPassword: string) {
    return await bcrypt.compare(password, hashedPassword);
}

//Hash payload before using in jwt.sign()
export async function hashPayload(payload: any) {
    return await bcrypt.hash(payload, 10);
}
