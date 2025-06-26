import { Data, Effect } from "effect";
import { tryCatch } from "./utils.js";

export const API_URL = "https://www.swapi.tech/api/people/1";

const getCharacterDetails = async () => {
  const response = await fetch(API_URL);
  return response.json();
};

// getCharacterDetails().then(console.log);

// possible issues
//
// API Can be down
// Bad internet
// response timeout
// response is not a valid star war ship
// auth failure etc etc

// Handling Error Path
const getCharacterDetailsV2 = async (): Promise<unknown> => {
  let response;
  try {
    response = await fetch(API_URL);
  } catch (e) {
    // Error with fetch: Do something here
    return;
  }

  try {
    return response.json();
  } catch (e) {
    // Error with json: Do something here
    return;
  }
};

// Or use signle try/catch and return a generic error
const getCharacterDetailsV3 = async () => {
  try {
    const response = await fetch(API_URL);
    return response.json();
  } catch (e) {
    // Some error somewhere 💁
    return;
  }
};

// never-throw
const getCharacterDetailsV4 = async () => {
  const { data: response, error: fetchError } = await tryCatch(fetch(API_URL));
  if (fetchError) {
    // Do something here
    return;
  }

  const { data: json, error: parseError } = await tryCatch(response.json());

  if (parseError) {
    // Do something here
    return;
  }
  return json;
};

// forces you to handle error, (which can be good depending on preference)
// sometimes we may just want to collect errors and propagate to the caller

class FetchError extends Data.TaggedError("FetchError")<Readonly<{}>> {}

class JsonError extends Data.TaggedError("JsonError")<Readonly<{}>> {}

const fetchRequest = Effect.tryPromise({
  try: () => fetch(API_URL),
  catch: () => new FetchError(),
});

const jsonResponse = (response: Response) =>
  Effect.tryPromise({
    try: () => response.json(),
    catch: () => new JsonError(),
  });

const main = fetchRequest.pipe(
  Effect.filterOrFail(
    (response) => response.ok,
    () => new FetchError(),
  ),
  Effect.flatMap(jsonResponse),
  Effect.catchTags({
    FetchError: () => Effect.succeed("Fetch error"),
    JsonError: () => Effect.succeed("Json error"),
  }),
);

Effect.runPromise(main).then(console.log);
