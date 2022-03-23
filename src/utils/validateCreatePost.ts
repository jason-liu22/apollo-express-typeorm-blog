import { FieldError } from "src/resolvers/FieldError";
import { PostInput } from "src/resolvers/PostInput";

export const validateCreatePost = (input: PostInput): [FieldError] | null => {
  if (!input.title) {
    return [{ field: "title", message: "Title is required." }];
  }
  if (!input.description) {
    return [
      {
        field: "description",
        message: "Description is required.",
      },
    ];
  }

  if (!input.body) {
    return [
      {
        field: "body",
        message: "Content is required.",
      },
    ];
  }

  return null;
};
