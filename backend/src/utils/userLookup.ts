import User from "../models/user.model";
import { normalizeEmail } from "./emailNormalize";

/**
 * Query tìm user theo email không phân biệt hoa thường.
 * Có thể chain: `.select('+password')` trước khi await.
 */
export function findUserByEmailCaseInsensitive(email: string) {
    const e = normalizeEmail(email);
    return User.findOne({
        isDeleted: { $ne: true },
        $expr: { $eq: [{ $toLower: "$email" }, e] },
    });
}
