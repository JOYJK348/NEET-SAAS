import { Global, Module } from '@nestjs/common';
import { STORAGE_SERVICE_TOKEN } from './interfaces/storage.interface';
import { SupabaseStorageService } from './supabase-storage.service';
import { StorageController } from './storage.controller';

@Global()
@Module({
  controllers: [StorageController],
  providers: [
    SupabaseStorageService,
    {
      provide: STORAGE_SERVICE_TOKEN,
      useExisting: SupabaseStorageService,
    },
  ],
  exports: [STORAGE_SERVICE_TOKEN, SupabaseStorageService],
})
export class StorageModule {}
