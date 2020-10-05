import { Injectable } from '@nestjs/common';
import { Observable, of, from } from 'rxjs';
import { RecipeEntry } from '../model/recipe-entry.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { RecipeEntity } from '../model/recipe-entry.entity';
import { Repository } from 'typeorm';
import { UserService } from 'src/user/service/user.service';
import { User } from 'src/user/models/user.interface';
import { switchMap, map } from 'rxjs/operators';
import {
  Pagination,
  IPaginationOptions,
  paginate,
} from 'nestjs-typeorm-paginate';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const slugify = require('slugify');

@Injectable()
export class RecipeService {
  constructor(
    @InjectRepository(RecipeEntity)
    private readonly recipeRepository: Repository<RecipeEntity>,
    private userService: UserService,
  ) {}

  create(user: User, recipeEntry: RecipeEntry): Observable<RecipeEntry> {
    recipeEntry.author = user;
    console.log(recipeEntry);
    return this.generateSlug(recipeEntry.title).pipe(
      switchMap((slug: string) => {
        recipeEntry.slug = slug;
        return from(this.recipeRepository.save(recipeEntry));
      }),
    );
  }

  findAll(): Observable<RecipeEntry[]> {
    return from(this.recipeRepository.find({ relations: ['author'] }));
  }

  paginateAll(
    options: IPaginationOptions,
  ): Observable<Pagination<RecipeEntry>> {
    return from(
      paginate<RecipeEntry>(this.recipeRepository, options, {
        relations: ['author'],
      }),
    ).pipe(map((recipeEntries: Pagination<RecipeEntry>) => recipeEntries));
  }

  paginateByUser(
    options: IPaginationOptions,
    userId: number,
  ): Observable<Pagination<RecipeEntry>> {
    return from(
      paginate<RecipeEntry>(this.recipeRepository, options, {
        relations: ['author'],
        where: [{ author: userId }],
      }),
    ).pipe(map((recipeEntries: Pagination<RecipeEntry>) => recipeEntries));
  }

  findOne(id: number): Observable<RecipeEntry> {
    return from(
      this.recipeRepository.findOne({ id }, { relations: ['author'] }),
    );
  }

  findByUser(userId: number): Observable<RecipeEntry[]> {
    return from(
      this.recipeRepository.find({
        where: {
          author: userId,
        },
        relations: ['author'],
      }),
    ).pipe(map((recipeEntries: RecipeEntry[]) => recipeEntries));
  }

  updateOne(id: number, recipeEntry: RecipeEntry): Observable<RecipeEntry> {
    return from(this.recipeRepository.update(id, recipeEntry)).pipe(
      switchMap(() => this.findOne(id)),
    );
  }

  deleteOne(id: number): Observable<any> {
    return from(this.recipeRepository.delete(id));
  }

  generateSlug(title: string): Observable<string> {
    return of(slugify(title));
  }

  async createComment(id: number, comment: string): Promise<RecipeEntry> {
    const recipe = await this.findOne(id).toPromise();
    recipe.comments.push(comment);
    return await this.recipeRepository.save(recipe);
  }

  async findAllComments(id: number): Promise<string[]> {
    const recipe = await this.findOne(id).toPromise();
    return recipe.comments;
  }

  async createLikes(user: User, recipe_id: number): Promise<RecipeEntry> {
    const recipe = await this.findOne(recipe_id).toPromise();

    const { likes } = recipe;
    if (likes !== null && likes.includes(user.id)) {
      console.log('estouaqui');
      const index = likes.indexOf(user.id);
      if (index > -1) {
        likes.splice(index, 1);
      }
    } else {
      likes.push(user.id);
    }
    return await this.recipeRepository.save(recipe);
  }

  async findAllLikes(id: number): Promise<number> {
    const recipe = await this.findOne(id).toPromise();
    return await recipe.likes.length;
  }
}
