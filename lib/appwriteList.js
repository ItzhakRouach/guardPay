import { Query } from "react-native-appwrite";
import { databases } from "./appwrite";

// Cursor-paginated listDocuments. The month query used to be a single call
// with Query.limit(60): a 31-day sick range alone is 31 documents, so a busy
// month silently lost shifts and understated the salary.
//
// `queries` must NOT include a limit or cursor; an orderAsc/orderDesc is
// fine (cursorAfter respects it). `maxPages` is a safety valve.
export async function listAllDocuments(
  databaseId,
  collectionId,
  queries = [],
  { pageSize = 100, maxPages = 50 } = {},
) {
  const all = [];
  let cursor = null;
  for (let page = 0; page < maxPages; page += 1) {
    const q = [...queries, Query.limit(pageSize)];
    if (cursor) q.push(Query.cursorAfter(cursor));
    const res = await databases.listDocuments(databaseId, collectionId, q);
    const docs = res.documents || [];
    all.push(...docs);
    if (docs.length < pageSize) break;
    cursor = docs[docs.length - 1].$id;
  }
  return all;
}
