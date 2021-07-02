# FAQ

`https://github.com/mongodb/mongo-go-driver`



```go
cursor, err := c.GetColl().Find()
    for cursor.Next(context.Background()) {
        index++
        if index%50 != 0 {
            // 每50条解析一次
            continue
        }
	if err = cursor.Decode(&path); err != nil {
            continue
        }
    }
```

cursor.Next()之后如果不执行 cursor.Decode()最后会导致内存泄漏



猜测是下面这个方法导致。

```go
// x/mongo/driver/list_collections_batch_cursor.go 48行
func (lcbc *ListCollectionsBatchCursor) Next(ctx context.Context) bool {
   if !lcbc.bc.Next(ctx) {
      return false
   }

   if !lcbc.legacy {
      lcbc.currentBatch.Style = lcbc.bc.currentBatch.Style
      lcbc.currentBatch.Data = lcbc.bc.currentBatch.Data
      lcbc.currentBatch.ResetIterator()
      return true
   }

   lcbc.currentBatch.Style = bsoncore.SequenceStyle
   lcbc.currentBatch.Data = lcbc.currentBatch.Data[:0]

   var doc bsoncore.Document
   for {
      doc, lcbc.err = lcbc.bc.currentBatch.Next()
      if lcbc.err != nil {
         if lcbc.err == io.EOF {
            lcbc.err = nil
            break
         }
         return false
      }
      doc, lcbc.err = lcbc.projectNameElement(doc)
      if lcbc.err != nil {
         return false
      }
      lcbc.currentBatch.Data = append(lcbc.currentBatch.Data, doc...)
   }

   return true
}
```

关键点为

```go
for{
         lcbc.currentBatch.Data = append(lcbc.currentBatch.Data, doc...)
}
```

最后` lcbc.currentBatch.Data `没有使用，一直堆积。