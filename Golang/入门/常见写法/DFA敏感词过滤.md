# DFA敏感词过滤



```go
/*
 * Copyright (c) 2018
 * time:   6/24/18 3:22 PM
 * author: linhuanchao
 * e-mail: 873085747@qq.com
 */

package util

import (
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

type SensitiveMap struct {
	sensitiveNode map[string]interface{}
	isEnd         bool
}

var s *SensitiveMap

func GetMap() *SensitiveMap {
	if s == nil {
		path:=GetCurPath()+"/conf/dictionary.txt" /
		//path:="D:/workspace/cfwd/conf/dictionary.txt"
		s = InitDictionary(s, path)
	}
	return s
}

/*
初始化敏感词词典结构体
*/
func initSensitiveMap() *SensitiveMap {
	return &SensitiveMap{
		sensitiveNode: make(map[string]interface{}),
		isEnd:         false,
	}
}

//获取当前路径
func GetCurPath() string {
	file, _ := exec.LookPath(os.Args[0])

	//得到全路径，比如在windows下E:\\golang\\test\\a.exe
	path, _ := filepath.Abs(file)

	rst := filepath.Dir(path)

	return rst
}

/*
读取词典文件
*/
func readDictionary(path string) []string {
	file, err := os.Open(path)
	if err != nil {
		panic(err)
	}
	defer file.Close()
	str, err := ioutil.ReadAll(file)
	dictionary := strings.Fields(string(str))
	return dictionary
}

/*
初始化敏感词词典，根据DFA算法构建trie
*/
func InitDictionary(s *SensitiveMap, dictionaryPath string) *SensitiveMap {
	s = initSensitiveMap()
	dictionary := readDictionary(dictionaryPath)
	for _, words := range dictionary {
		sMapTmp := s
		w := []rune(words)
		wordsLength := len(w)
		for i := 0; i < wordsLength; i++ {
			t := string(w[i])
			isEnd := false
			//如果是敏感词的最后一个字，则确定状态
			if i == (wordsLength - 1) {
				isEnd = true
			}
			func(tx string) {
				if _, ok := sMapTmp.sensitiveNode[tx]; !ok { //如果该字在该层级索引中找不到，则创建新的层级
					sMapTemp := new(SensitiveMap)
					sMapTemp.sensitiveNode = make(map[string]interface{})
					sMapTemp.isEnd = isEnd
					sMapTmp.sensitiveNode[tx] = sMapTemp
				}
				sMapTmp = sMapTmp.sensitiveNode[tx].(*SensitiveMap) //进入下一层级
				sMapTmp.isEnd = isEnd
			}(t)
		}
	}
	return s
}

/*
作用：检查是否含有敏感词，仅返回检查到的第一个敏感词
返回值：敏感词，是否含有敏感词
*/
func (s *SensitiveMap) CheckSensitive(text string) (string, bool) {
	content := []rune(text)
	contentLength := len(content)
	result := false
	ta := ""
	for index := range content {
		sMapTmp := s
		target := ""
		in := index
		for {
			wo := string(content[in])
			target += wo
			if _, ok := sMapTmp.sensitiveNode[wo]; ok {
				if sMapTmp.sensitiveNode[wo].(*SensitiveMap).isEnd {
					result = true
					break
				}
				if in == contentLength-1 {
					break
				}
				sMapTmp = sMapTmp.sensitiveNode[wo].(*SensitiveMap) //进入下一层级
				in++
			} else {
				break
			}
		}
		if result {
			ta = target
			break
		}
	}
	return ta, result
}

/*
作用：返回文本中的所有敏感词
返回值：数组，格式为“["敏感词"][敏感词在检测文本中的索引位置，敏感词长度]”
*/
type Target struct {
	Indexes []int
	Len     int
}

func (s *SensitiveMap) FindAllSensitive(text string) map[string]*Target {
	content := []rune(text)
	contentLength := len(content)
	result := false

	ta := make(map[string]*Target)
	for index := range content {
		sMapTmp := s
		target := ""
		in := index
		result = false
		for {
			wo := string(content[in])
			target += wo
			if _, ok := sMapTmp.sensitiveNode[wo]; ok {
				if sMapTmp.sensitiveNode[wo].(*SensitiveMap).isEnd {
					result = true
					break
				}
				if in == contentLength-1 {
					break
				}
				sMapTmp = sMapTmp.sensitiveNode[wo].(*SensitiveMap) //进入下一层级
				in++
			} else {
				break
			}
		}
		if result {
			if _, targetInTa := ta[target]; targetInTa {
				ta[target].Indexes = append(ta[target].Indexes, index)
			} else {
				ta[target] = &Target{
					Indexes: []int{index},
					Len:     len([]rune(target)),
				}
			}
		}
	}
	return ta
}

```

