# gRPC Benchmark Tools



https://github.com/bojand/ghz





```sh
./ghz -c 100 -n 100000 \
  --insecure \
  --proto ./hello_world.proto \
  --call helloworld.Greeter.SayHello \
  -d '{"name":"Joe"}' \
  0.0.0.0:50051
```

