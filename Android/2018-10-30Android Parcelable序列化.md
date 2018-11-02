# Android Parcelable序列化

1.实现Parcelable接口

2.重写两个方法

```java
 //private String NewName;
 //private String NewAddress;
@Override
    public int describeContents() {
        return 0;
    }

    @Override
    public void writeToParcel(Parcel dest, int flags) {
        //顺序必须最好前面声明时顺序一样 等会读的时候也是按照这个顺序读出来的
        dest.writeString(NewName);
        dest.writeString(NewAddress);
    }
```

3.CREATOR

```java
    public static final Creator<NewUser> CREATOR = new Creator<NewUser>() {
        @Override
        public NewUser createFromParcel(Parcel in) {
            return new NewUser(in);
        }

        @Override
        public NewUser[] newArray(int size) {
            return new NewUser[size];
        }
    };
```

4.完整代码

```java
public class NewUser implements Parcelable {
    private String NewName;
    private String NewAddress;

    public NewUser(String newName, String newAddress) {
        NewName = newName;
        NewAddress = newAddress;
    }

    public String getNewName() {
        return NewName;
    }

    public void setNewName(String newName) {
        NewName = newName;
    }

    public String getNewAddress() {
        return NewAddress;
    }

    public void setNewAddress(String newAddress) {
        NewAddress = newAddress;
    }

    protected NewUser(Parcel in) {
        NewName = in.readString();
        NewAddress = in.readString();
    }

    public static final Creator<NewUser> CREATOR = new Creator<NewUser>() {
        @Override
        public NewUser createFromParcel(Parcel in) {
            return new NewUser(in);
        }

        @Override
        public NewUser[] newArray(int size) {
            return new NewUser[size];
        }
    };

    @Override
    public int describeContents() {
        return 0;
    }

    @Override
    public void writeToParcel(Parcel dest, int flags) {
        dest.writeString(NewName);
        dest.writeString(NewAddress);
    }

}
```

5.使用

```java
//传递
Intent intent = new Intent(MainActivity.this, Main2Activity.class);
NewUser newUser = new NewUser("NewName", "NewAddress");
intent.putExtra("NewUser", newUser);
startActivity(intent);
```

```java
//获取
Intent intent = getIntent();
Bundle extras = intent.getExtras();
NewUser newUser = (NewUser) extras.get("NewUser");
final String newName = newUser.getNewName();
final String newAddress = newUser.getNewAddress();
```