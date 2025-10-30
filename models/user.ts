import { Schema, model, models, HydratedDocument, Model } from "mongoose";

export interface IUser {
  _id: string | { toString(): string };
  email: string;
  name?: string;
  picture?: string;
  favorites: string[];
  earlyAccess: boolean;
  creditsRemaining: number;
}

export interface IUserMethods {
  addFavorite(slug: string): Promise<void>;
  removeFavorite(slug: string): Promise<void>;
  toggleFavorite(slug: string): Promise<boolean>;
  toPublic(): {
    id: string;
    email: string;
    name?: string;
    picture?: string;
    favorites: string[];
    earlyAccess: boolean;
    initials: string;
    creditsRemaining: number;
  };
}

export interface IUserStatics {
  addFavoriteByEmail(
    email: string,
    slug: string
  ): Promise<HydratedDocument<IUser, IUserMethods> | null>;
  removeFavoriteByEmail(
    email: string,
    slug: string
  ): Promise<HydratedDocument<IUser, IUserMethods> | null>;
}

export type UserModel = Model<IUser, {}, IUserMethods, IUserStatics>;

const UserSchema = new Schema<IUser, UserModel, IUserMethods, IUserStatics>(
  {
    email: { type: String, required: true, unique: true, trim: true },
    name: { type: String, trim: true },
    picture: { type: String },
    favorites: [{ type: String }],
    earlyAccess: { type: Boolean, default: false },
    creditsRemaining: { type: Number, default: 5 }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);


// Methods for managing favorites
UserSchema.methods.addFavorite = async function (slug: string) {
  if (!this.favorites.includes(slug)) {
    this.favorites.push(slug);
    await this.save();
  }
};

UserSchema.methods.removeFavorite = async function (slug: string) {
  if (this.favorites.includes(slug)) {
    this.favorites = this.favorites.filter((f) => f !== slug);
    await this.save();
  }
};

UserSchema.methods.toggleFavorite = async function (slug: string) {
  if (this.favorites.includes(slug)) {
    this.favorites = this.favorites.filter((f) => f !== slug);
    await this.save();
    return false;
  }
  this.favorites.push(slug);
  await this.save();
  return true;
};

UserSchema.methods.toPublic = function () {
  const initials =
    this.name
      ?.split(/\s+/)
      .map((s: string) => s[0]?.toUpperCase())
      .slice(0, 2)
      .join("") || this.email.slice(0, 2).toUpperCase();

  return {
    id: this._id.toString(),
    email: this.email,
    name: this.name,
    picture: this.picture,
    favorites: this.favorites,
    earlyAccess: this.earlyAccess,
    initials,
    creditsRemaining: this.creditsRemaining,
  };
};


// Static helpers
UserSchema.statics.addFavoriteByEmail = async function (email: string, slug: string) {
  const user = await this.findOne({ email });
  if (!user) return null;
  await user.addFavorite(slug);
  return user;
};

UserSchema.statics.removeFavoriteByEmail = async function (email: string, slug: string) {
  const user = await this.findOne({ email });
  if (!user) return null;
  await user.removeFavorite(slug);
  return user;
};

// Pre-save hook to initialize credits correctly
UserSchema.pre("save", function (next) {
  if (this.isNew) {
    if (this.earlyAccess) {
      this.creditsRemaining = 200;
    } else {
      this.creditsRemaining = 5;
    }
  }
  next();
});

const User = (models.User as UserModel) || model<IUser, UserModel>("User", UserSchema);
export default User;
