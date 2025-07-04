import { Data, Effect } from "effect";
import { API_URL } from "./pipe.js";

/** Errors **/
class FetchError extends Data.TaggedError("FetchError")<{}> {}
class JsonError extends Data.TaggedError("JsonError")<{}> {}

/** Implementation **/
const fetchRequest = Effect.tryPromise({
  try: () => fetch(API_URL),
  catch: () => new FetchError(),
});

const jsonResponse = (response: Response) =>
  Effect.tryPromise({
    try: () => response.json(),
    catch: () => new JsonError(),
  });

const program = Effect.gen(function* () {
  const response = yield* fetchRequest;
  if (!response.ok) {
    return yield* new FetchError();
  }

  return yield* jsonResponse(response);
});

/** Error handling **/
const main = program.pipe(
  Effect.catchTags({
    FetchError: () => Effect.succeed("Fetch error"),
    JsonError: () => Effect.succeed("Json error"),
  }),
);

/** Running effect **/
Effect.runPromise(main).then(console.log);
