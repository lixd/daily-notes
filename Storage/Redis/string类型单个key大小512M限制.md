

```c
static int checkStringLength(redisClient *c, long long size) {
    if (size > 512*1024*1024) {
        addReplyError(c,"string exceeds maximum allowed size (512MB)");
        return REDIS_ERR;
    }
    return REDIS_OK;
}
```

任何输入字符串类命令都会调用这个函数做检查，比如:

```c
void appendCommand(redisClient *c) {
    size_t totlen;
    robj *o, *append;

    o = lookupKeyWrite(c->db,c->argv[1]);
    if (o == NULL) {
        /* Create the key */
        c->argv[2] = tryObjectEncoding(c->argv[2]);
        dbAdd(c->db,c->argv[1],c->argv[2]);
        incrRefCount(c->argv[2]);
        totlen = stringObjectLen(c->argv[2]);
    } else {
        /* Key exists, check type */
        if (checkType(c,o,REDIS_STRING))
            return;

        /* "append" is an argument, so always an sds */
        append = c->argv[2];
        totlen = stringObjectLen(o)+sdslen(append->ptr);
        if (checkStringLength(c,totlen) != REDIS_OK)
            return;

        /* If the object is shared or encoded, we have to make a copy */
        if (o->refcount != 1 || o->encoding != REDIS_ENCODING_RAW) {
            robj *decoded = getDecodedObject(o);
            o = createStringObject(decoded->ptr, sdslen(decoded->ptr));
            decrRefCount(decoded);
            dbOverwrite(c->db,c->argv[1],o);
        }

        /* Append the value */
        o->ptr = sdscatlen(o->ptr,append->ptr,sdslen(append->ptr));
        totlen = sdslen(o->ptr);
    }
    signalModifiedKey(c->db,c->argv[1]);
    server.dirty++;
    addReplyLongLong(c,totlen);
}
```

