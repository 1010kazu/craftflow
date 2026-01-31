// app/api/recipes/import/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/api';
import { requireAdmin } from '@/lib/utils/auth-middleware';
import { ItemType, ImportItemData } from '@/types';
import Papa from 'papaparse';

// POST /api/recipes/import - CSV/JSONインポート（管理者のみ）
export const POST = requireAdmin(async (request) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const format = formData.get('format') as string;
    const gameId = formData.get('gameId') as string;

    if (!file || !format || !gameId) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'ファイル、形式、ゲームIDは必須です'),
        { status: 400 }
      );
    }

    // ゲームの存在確認
    const game = await prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      return NextResponse.json(
        createErrorResponse('NOT_FOUND', 'ゲームが見つかりません'),
        { status: 404 }
      );
    }

    const fileText = await file.text();
    let items: ImportItemData[] = [];

    if (format === 'json') {
      const data = JSON.parse(fileText);
      items = data.items || [];
    } else if (format === 'csv') {
      const parsed = Papa.parse(fileText, {
        header: true,
        skipEmptyLines: true,
      });
      items = parsed.data.map((row: any) => {
        const materials: { name: string; quantity: number }[] = [];
        let i = 5; // 素材1の列から開始
        while (row[`素材${Math.floor((i - 5) / 2) + 1}`] && row[`個数${Math.floor((i - 5) / 2) + 1}`]) {
          materials.push({
            name: row[`素材${Math.floor((i - 5) / 2) + 1}`],
            quantity: parseInt(row[`個数${Math.floor((i - 5) / 2) + 1}`]),
          });
          i += 2;
        }
        return {
          name: row['アイテム名'],
          craftTime: parseInt(row['時間(秒)']),
          requiredFacility: row['施設'] || undefined,
          itemType: row['アイテム種別'] as ItemType,
          outputCount: parseInt(row['作成個数']),
          materials,
        };
      });
    } else {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'サポートされていない形式です'),
        { status: 400 }
      );
    }

    const errors: { row: number; message: string }[] = [];
    let imported = 0;

    for (let i = 0; i < items.length; i++) {
      const itemData = items[i];
      try {
        // アイテムを作成または取得
        let item = await prisma.item.findUnique({
          where: {
            gameId_name: {
              gameId,
              name: itemData.name,
            },
          },
        });

        if (!item) {
          item = await prisma.item.create({
            data: {
              gameId,
              name: itemData.name,
              itemType: itemData.itemType,
            },
          });
        }

        // レシピがある場合
        if (itemData.materials && itemData.materials.length > 0) {
          // 既存レシピを削除
          await prisma.recipe.deleteMany({
            where: { itemId: item.id },
          });

          // 施設を取得
          let requiredFacilityId: string | undefined;
          if (itemData.requiredFacility) {
            const facility = await prisma.item.findFirst({
              where: {
                gameId,
                name: itemData.requiredFacility,
                itemType: ItemType.FACILITY,
              },
            });
            if (facility) {
              requiredFacilityId = facility.id;
            }
          }

          // 素材アイテムを取得
          const materialItems = await Promise.all(
            itemData.materials.map(async (mat) => {
              let materialItem = await prisma.item.findUnique({
                where: {
                  gameId_name: {
                    gameId,
                    name: mat.name,
                  },
                },
              });

              if (!materialItem) {
                materialItem = await prisma.item.create({
                  data: {
                    gameId,
                    name: mat.name,
                    itemType: ItemType.MATERIAL,
                  },
                });
              }

              return {
                materialItemId: materialItem.id,
                quantity: mat.quantity,
              };
            })
          );

          // レシピを作成
          await prisma.recipe.create({
            data: {
              itemId: item.id,
              craftTime: itemData.craftTime,
              outputCount: itemData.outputCount,
              requiredFacilityId,
              materials: {
                create: materialItems,
              },
            },
          });
        }

        imported++;
      } catch (error: any) {
        errors.push({
          row: i + 1,
          message: error.message || 'インポートエラー',
        });
      }
    }

    return NextResponse.json(
      createSuccessResponse({
        success: true,
        imported,
        errors,
      })
    );
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'サーバーエラーが発生しました'),
      { status: 500 }
    );
  }
});
