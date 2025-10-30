import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db"; // Now uses Supabase-based functions

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const { supabase } = await import("./supabase");

        // ตรวจสอบ email และ password กับ users table โดยตรง
        const { data: userRow, error } = await supabase
          .from("users")
          .select("*")
          .eq("email", input.email)
          .eq("password", input.password)
          .maybeSingle();

        if (error || !userRow) {
          throw new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        }

        // อัปเดต lastSignedIn
        await supabase
          .from("users")
          .update({ lastSignedIn: new Date().toISOString() })
          .eq("id", userRow.id);

        // สร้าง session token
        const { sdk } = await import("./_core/sdk");
        const sessionToken = await sdk.createSessionToken(userRow.openId || userRow.id.toString(), {
          name: userRow.name ?? userRow.email ?? "",
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

        return { success: true, user: userRow };
      }),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      const { supabase } = await import("./supabase");
      await supabase.auth.signOut();
      
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  infoLog: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllInfoLogs();
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getInfoLogById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        lineId: z.string().optional(),
        phoneNumber: z.string().optional(),
        registrationDate: z.string().optional(),
        expirationDate: z.string().optional(),
        package: z.string().optional(),
        packagePrice: z.number().optional(),
        email: z.string().optional(),
        houseGroup: z.string().optional(),
        customerName: z.string().optional(),
        channel: z.enum(["line", "facebook", "walk-in", "other"]).optional(),
        cancelledOrMoved: z.enum(["cancelled", "moved", ""]).optional(),
        syncStatus: z.enum(["ok", "error", "pending"]).optional(),
        syncNote: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const created = await db.createInfoLog(input);
        // Auto-sync from the latest info_log of this email (renewal behavior)
        try {
          if (created?.email) {
            await db.syncMembershipByEmail(created.email);
          }
        } catch (e: any) {
          // If capacity is full or other sync error, surface a friendly error
          throw new Error(e?.message || 'บันทึกสำเร็จ แต่ซิงก์สมาชิก (ต่ออายุ) ไม่สำเร็จ');
        }
        return created;
      }),
    
      update: protectedProcedure
      .input(z.object({
        id: z.number(),
        lineId: z.string().optional(),
        phoneNumber: z.string().optional(),
        registrationDate: z.string().optional(),
        expirationDate: z.string().optional(),
        package: z.string().optional(),
        packagePrice: z.number().optional(),
        email: z.string().optional(),
        houseGroup: z.string().optional(),
        customerName: z.string().optional(),
        channel: z.enum(["line", "facebook", "walk-in", "other"]).optional(),
        cancelledOrMoved: z.enum(["cancelled", "moved", ""]).optional(),
        syncStatus: z.enum(["ok", "error", "pending"]).optional(),
      }))
      .mutation(async ({ input }) => {
        // Update info_log row
        await db.updateInfoLog(input.id, input);
        // After update, sync using the latest info_log for that email (if email exists)
        const updated = await db.getInfoLogById(input.id);
        try {
          if (updated?.email) {
            await db.syncMembershipByEmail(updated.email);
          }
        } catch (e: any) {
          // Bubble meaningful capacity error to client
          throw new Error(e?.message || 'อัปเดตสำเร็จ แต่ซิงก์สมาชิกไม่สำเร็จ');
        }
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteInfoLog(input.id);
        return { success: true };
      }),
  }),

  house: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllHouses();
    }),
    listWithMemberCount: protectedProcedure.query(async () => {
        const houses = await db.getAllHouses();
        const members = await db.getAllMembers();
        return houses.map(house => {
            const memberCount = members.filter(m => (m as any).houseId === house.id).length;
            return { ...house, memberCount };
        });
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getHouseById(input.id);
      }),
    
    getByNumber: protectedProcedure
      .input(z.object({ houseNumber: z.string() }))
      .query(async ({ input }) => {
        return await db.getHouseByNumber(input.houseNumber);
      }),
    
    create: protectedProcedure
      .input(z.object({
        houseNumber: z.string(),
        adminEmail: z.string().optional(),
        registrationDate: z.string().optional(),
        status: z.enum(["active", "expired", "moved", "cancelled"]).optional(),
        note: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createHouse(input);
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        houseNumber: z.string().optional(),
        adminEmail: z.string().optional(),
        registrationDate: z.string().optional(),
        status: z.enum(["active", "expired", "moved", "cancelled"]).optional(),
        note: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...rest } = input;
        return await db.updateHouse(id, rest);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteHouse(input.id);
        return { success: true };
      }),
  }),

  member: router({
    listAvailableHouses: protectedProcedure.query(async () => {
      const houses = await db.getAllHouses();
      const members = await db.getAllMembers();
      return houses.filter(house => {
        const memberCount = members.filter(m => (m as any).houseId === house.id).length;
        return memberCount < 5;
      });
    }),
    list: protectedProcedure.query(async () => {
      return await db.getAllMembers();
    }),
    listActive: protectedProcedure.query(async () => {
        return await db.getActiveMembers();
    }),
    listExpired: protectedProcedure.query(async () => {
        return await db.getExpiredMembers();
    }),
      listArchived: protectedProcedure.query(async () => {
          return await db.getArchivedMembers();
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getMemberById(input.id);
      }),
    
    getByHouseId: protectedProcedure
      .input(z.object({ houseId: z.number() }))
      .query(async ({ input }) => {
        return await db.getMembersByHouseId(input.houseId);
      }),
    
    // Creation of members must originate from InfoLog selection by admin
    create: protectedProcedure
      .input(z.object({
        houseId: z.number(),
        memberEmail: z.string(),
        expirationDate: z.string().optional(),
        note: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async () => {
        throw new Error('การเพิ่มสมาชิกใหม่ต้องทำผ่าน InfoLog เท่านั้น');
      }),
    
    // Updates are restricted: expirationDate must mirror InfoLog; disallow direct changes
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        houseId: z.number().optional(),
        memberEmail: z.string().optional(),
        expirationDate: z.string().optional(),
        note: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...rest } = input;
        // Allow all fields to be updated directly from the UI
        return await db.updateMember(id, rest);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteMember(input.id);
        return { success: true };
      }),
    
    cleanupExpired: protectedProcedure
      .mutation(async () => {
        const { supabase } = await import("./supabase");
        // Call the SQL function to remove expired members
        const { data, error } = await supabase.rpc('remove_expired_members');
        if (error) {
          console.error('Error removing expired members:', error);
          throw new Error('ไม่สามารถลบสมาชิกหมดอายุได้');
        }
        return { success: true, deletedCount: data || 0 };
      }),
  }),
});

export type AppRouter = typeof appRouter;
