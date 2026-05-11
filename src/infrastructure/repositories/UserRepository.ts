import mongoose from 'mongoose';
import { User } from '../../domain/entities/User';
import { connectToDatabase } from '../db/connect';
import { UserModel, IUserDocument } from '../db/models/User';

export class UserRepository {
  
  /**
   * Helper function mapping tightly-coupled Mongoose documents to purely defined Domain User Entities
   */
  private static mapToDomain(doc: IUserDocument): User {
    return {
      id: doc._id.toString(),
      username: doc.username,
      name: doc.name,
      email: doc.email,
      passwordHash: doc.passwordHash,
      role: doc.role,
      profilePhoto: doc.profilePhoto,
      bio: doc.bio,
      createdAt: doc.createdAt
    } as User;
  }

  /**
   * Write operation to persist a new user entity constraint shape
   */
  static async createUser(data: Partial<User>): Promise<User> {
    await connectToDatabase();
    // Leverage mongoose internal logic to shape and save
    const created = await UserModel.create(data);
    return this.mapToDomain(created);
  }

  /**
   * Find a user exclusively by their Email string
   */
  static async findByEmail(email: string): Promise<User | null> {
    await connectToDatabase();
    const doc = await UserModel.findOne({ email }).lean() as any;
    if (!doc) return null;
    return this.mapToDomain(doc);
  }

  /**
   * Find a user by internal Unique ID
   */
  static async findById(id: string): Promise<User | null> {
    await connectToDatabase();
    // Catch casting exceptions dynamically if generic UUID string is injected
    try {
      const doc = await UserModel.findById(id).lean() as IUserDocument;
      if (!doc) return null;
      return this.mapToDomain(doc);
    } catch {
      return null;
    }
  }

  /**
   * Abstract find by custom property
   */
  static async findByProperty(query: any): Promise<User | null> {
    await connectToDatabase();
    const doc = await UserModel.findOne(query).lean() as any;
    if (!doc) return null;
    return this.mapToDomain(doc);
  }

  /**
   * Alter subset configuration in the store natively
   */
  static async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    await connectToDatabase();
    const doc = await UserModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, lean: true }
    ) as IUserDocument;
    
    if (!doc) return null;
    return this.mapToDomain(doc);
  }

  /**
   * Fully drop tracking memory of an existing user
   */
  static async deleteUser(id: string): Promise<boolean> {
    await connectToDatabase();
    const result = await UserModel.findByIdAndDelete(id).lean();
    // Cast to explicit boolean true/false context matching whether it existed to begin with
    return result !== null;
  }

  /**
   * Search users by username or email
   */
  static async searchUsers(query: string): Promise<User[]> {
    await connectToDatabase();
    
    const filter = query 
      ? {
          $or: [
            { username: new RegExp(query, 'i') },
            { email: new RegExp(query, 'i') },
            { name: new RegExp(query, 'i') }
          ]
        }
      : {};

    const docs = await UserModel.find(filter).limit(10).lean() as IUserDocument[];
    
    return docs.map(doc => this.mapToDomain(doc));
  }
}
