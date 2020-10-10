import { RecipeEntry } from 'src/recipe/model/recipe-entry.interface';
import { User } from 'src/user/models/user.interface';

export interface CommentsEntry {
  id: number;
  createdAt: Date;	 
  author: User;
  comment: string;
  recipe: RecipeEntry;
}
