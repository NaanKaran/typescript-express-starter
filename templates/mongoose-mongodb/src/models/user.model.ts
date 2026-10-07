import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

/**
 * User 스키마
 * - password는 기본 조회에서 제외(select: false)되며 필요 시 `.select('+password')`로 명시 조회
 * - timestamps: createdAt / updatedAt 자동 관리
 */
const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    firstName: { type: String, trim: true, maxlength: 100, default: null },
    lastName: { type: String, trim: true, maxlength: 100, default: null },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    collection: 'users',
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret._id;
        delete ret.password;
        return ret;
      },
    },
  },
);

// 최신 생성순 목록 조회 최적화
userSchema.index({ createdAt: -1 });

export type UserSchema = InferSchemaType<typeof userSchema>;
export type UserDocument = HydratedDocument<UserSchema>;

export const UserModel = model('User', userSchema);
