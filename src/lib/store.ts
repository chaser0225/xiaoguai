import { getSupabaseClient } from '@/storage/database/supabase-client';

// 商品数据类型定义（前端用 camelCase）
export interface ShoppingItem {
  id: string;
  title: string;
  taobaoUrl: string;
  imageUrl: string;
  price: string;
  addedAt: number;
  status: 'pending' | 'purchased' | 'removed';
  sourceType: 'taobao_link' | 'tmall_link' | 'taobao_code' | 'manual';
  rawInput: string;
}

// 数据库行类型（snake_case）
interface ShoppingItemRow {
  id: string;
  title: string;
  taobao_url: string | null;
  image_url: string | null;
  price: string | null;
  source_type: string;
  raw_input: string | null;
  status: string;
  added_at: string;
}

// 数据库行 → 前端对象
function rowToItem(row: ShoppingItemRow): ShoppingItem {
  return {
    id: row.id,
    title: row.title,
    taobaoUrl: row.taobao_url || '',
    imageUrl: row.image_url || '',
    price: row.price || '',
    sourceType: row.source_type as ShoppingItem['sourceType'],
    rawInput: row.raw_input || '',
    status: row.status as ShoppingItem['status'],
    addedAt: new Date(row.added_at).getTime(),
  };
}

// 生成唯一ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

// 获取所有有效商品（未被移除的）
export async function getAllItems(): Promise<ShoppingItem[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('shopping_items')
    .select('*')
    .neq('status', 'removed')
    .order('added_at', { ascending: false });
  if (error) throw new Error(`查询商品失败: ${error.message}`);
  return (data as ShoppingItemRow[]).map(rowToItem);
}

// 获取单个商品
export async function getItem(id: string): Promise<ShoppingItem | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('shopping_items')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`查询商品失败: ${error.message}`);
  if (!data) return null;
  return rowToItem(data as ShoppingItemRow);
}

// 添加商品
export async function addItem(
  data: Omit<ShoppingItem, 'id' | 'addedAt' | 'status'>
): Promise<ShoppingItem> {
  const client = getSupabaseClient();
  const id = generateId();
  const row = {
    id,
    title: data.title,
    taobao_url: data.taobaoUrl || null,
    image_url: data.imageUrl || null,
    price: data.price || null,
    source_type: data.sourceType,
    raw_input: data.rawInput || null,
    status: 'pending',
  };
  const { data: inserted, error } = await client
    .from('shopping_items')
    .insert(row)
    .select()
    .single();
  if (error) throw new Error(`添加商品失败: ${error.message}`);
  return rowToItem(inserted as ShoppingItemRow);
}

// 更新商品状态
export async function updateItemStatus(
  id: string,
  status: ShoppingItem['status']
): Promise<ShoppingItem | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('shopping_items')
    .update({ status })
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw new Error(`更新商品状态失败: ${error.message}`);
  if (!data) return null;
  return rowToItem(data as ShoppingItemRow);
}

// 更新商品信息（标题、图片等）
export async function updateItemInfo(
  id: string,
  info: { title?: string; imageUrl?: string; price?: string }
): Promise<ShoppingItem | null> {
  const client = getSupabaseClient();
  const updateData: Record<string, string> = {};
  if (info.title) updateData.title = info.title;
  if (info.imageUrl) updateData.image_url = info.imageUrl;
  if (info.price) updateData.price = info.price;
  
  const { data, error } = await client
    .from('shopping_items')
    .update(updateData)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw new Error(`更新商品信息失败: ${error.message}`);
  if (!data) return null;
  return rowToItem(data as ShoppingItemRow);
}

// 删除商品
export async function deleteItem(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('shopping_items')
    .delete()
    .eq('id', id);
  if (error) throw new Error(`删除商品失败: ${error.message}`);
  return true;
}

// 获取商品数量
export async function getItemCount(): Promise<number> {
  const client = getSupabaseClient();
  const { count, error } = await client
    .from('shopping_items')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'removed');
  if (error) throw new Error(`统计商品失败: ${error.message}`);
  return count ?? 0;
}
