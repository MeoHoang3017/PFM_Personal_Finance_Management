/**
 * Room Cleanup Utility
 * @description Cleans up expired rooms from database
 */

import Room from "../models/room.model";
import mongoose from "mongoose";

/**
 * Cleanup expired rooms
 * Nên được gọi định kỳ (ví dụ: mỗi giờ) hoặc khi server start
 */
export async function cleanupExpiredRooms(): Promise<number> {
  try {
    const result = await Room.deleteMany({
      expiresAt: { $lte: new Date() },
      status: { $in: ['waiting', 'starting', 'closed'] }, // Chỉ xóa rooms không đang chơi
    });

    const deletedCount = result.deletedCount || 0;
    
    if (deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletedCount} expired room(s)`);
    }

    return deletedCount;
  } catch (error) {
    console.error('❌ Error cleaning up expired rooms:', error);
    return 0;
  }
}

/**
 * Cleanup rooms that have been in-game for too long (stale matches)
 * Rooms in-game quá 24 giờ mà không có activity
 */
export async function cleanupStaleRooms(): Promise<number> {
  try {
    const staleThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    const result = await Room.updateMany(
      {
        status: 'in-game',
        updatedAt: { $lt: staleThreshold },
      },
      {
        $set: { status: 'closed' },
      }
    );

    const updatedCount = result.modifiedCount || 0;
    
    if (updatedCount > 0) {
      console.log(`🧹 Closed ${updatedCount} stale room(s)`);
    }

    return updatedCount;
  } catch (error) {
    console.error('❌ Error cleaning up stale rooms:', error);
    return 0;
  }
}

/**
 * Run all cleanup tasks
 */
export async function runCleanup(): Promise<{
  expired: number;
  stale: number;
}> {
  const expired = await cleanupExpiredRooms();
  const stale = await cleanupStaleRooms();
  
  return { expired, stale };
}

