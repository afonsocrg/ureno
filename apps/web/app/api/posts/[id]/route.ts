import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { NotFoundError, handleError, UnauthorizedError, InternalServerError, BadRequestError } from '@/lib/errors';
import { assertAuthenticated } from '@/lib/supabase/authentication'

export interface RouteParams {
  params: {
    id: string;
  };
}

export interface UpdatePostBody {
  title?: string;
  content?: string;
  is_public?: boolean;
}

export async function POST(request: Request, routeParams: RouteParams) {
  try {
    const { id } = await routeParams.params;
    const supabase = await createClient();

    const user = await assertAuthenticated(supabase);
    
    // RLS is responsible for checking if the user is the author of the post

    const { title, content, is_public }: UpdatePostBody = await request.json();

    const updatePayload = { content, title, is_public }
    console.log({updatePayload})

    console.log({id})

    // 5. Update post
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updatedPost) {
      console.error('Failed to update post', { updateError });
      throw new BadRequestError('Failed to update post');
    }

    return NextResponse.json({ 
      message: 'Post updated successfully', 
      post: updatedPost 
    });
    
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, routeParams: RouteParams) {
  try {
    const { id } = await routeParams.params;
    const supabase = await createClient();
    
    await assertAuthenticated(supabase);
    // RLS is responsible for checking if the user is the author of the post

    const result = await supabase
      .from('posts')
      .delete()
      .eq('id', id)
      .single();

    console.log('result', result );

    const { data: post, error: postError } = result;

    console.log({ post, postError });
    if (postError || !post) {
      console.error('Failed to delete post', { postError });
      throw new BadRequestError('Failed to delete post');
    }

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    return handleError(error);
  }
}