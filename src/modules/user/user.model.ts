import { model, Schema, Types } from 'mongoose';
import { TProfileImage, TUser, UserModal } from './user.interface';
import paginate from '../../common/plugins/paginate';
import bcryptjs from 'bcryptjs';
import { config } from '../../config';
import { Gender, MaritalStatus, UserStatus } from './user.constant';
import { Roles } from '../../middlewares/roles';

// Profile Image Schema
const profileImageSchema = new Schema<TProfileImage>({
  imageUrl: {
    type: String,
    required: [true, 'Image url is required'],
    default: '/uploads/users/user.png',
  },
});

// User Schema Definition
const userSchema = new Schema<TUser, UserModal>(
  {
    fname: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lname: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
      minlength: [8, 'Password must be at least 8 characters long'],
    },
    profileImage: {
      type: profileImageSchema,
      required: false,
      default: { imageUrl: '/uploads/users/user.png' },
    },
    // photoGallery: {
    //   type: [profileImageSchema],
    //   required: false,
    // },

    // location: {
    //   latitude: { type: Number, required: true },
    //   longitude: { type: Number, required: true },
    // },
    // gender: {
    //   type: String,
    //   enum: {
    //     values: Gender,
    //     message: '{VALUE} is not a valid gender',
    //   },
    //   required: [true, 'Gender is required'],
    // },

    address: {
      streetAddress : {
        type: String,
        required: [true, 'Street Address is required']
      },
      city : {
        type: String,
        required: [true, 'City is required']
      },
      zipCode : {
        type: String,
        required: [true, 'Address is required']
      },
      country : {
        type: String,
        required: [true, 'Address is required']
      },
    },

    companyName: { type: String },
    role: {
      type: String,
      enum: {
        values: Roles,
        message: '{VALUE} is not a valid role',
      },
      required: [true, 'Role is required'],
    },
    superVisorsManagerId : 
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [false, 'Created By Manager Id is required'],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    phoneNumber : {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },

    lastPasswordChange: { type: Date },
    isResetPassword: {
      type: Boolean,
      default: false,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: { type: Date }, // 🔴 not sure 
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Apply the paginate plugin
userSchema.plugin(paginate);

// Static methods
userSchema.statics.isExistUserById = async function (id: string) {
  return await this.findById(id);
};

userSchema.statics.isExistUserByEmail = async function (email: string) {
  return await this.findOne({ email });
};

userSchema.statics.isMatchPassword = async function (
  password: string,
  hashPassword: string,
): Promise<boolean> {
  return await bcryptjs.compare(password, hashPassword);
};

// FIX : ts issue 
// Middleware to hash password before saving
userSchema.pre('save', async function (next) {

  if (this.isModified('password')) {
    this.password = await bcryptjs.hash(
      this.password,
      Number(config.bcrypt.saltRounds),
    );
  }
  next();
});

// Use transform to rename _id to _projectId
userSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._userId = ret._id;  // Rename _id to _projectId
    delete ret._id;  // Remove the original _id field
    return ret;
  }
});

// Export the User model
export const User = model<TUser, UserModal>('User', userSchema);
