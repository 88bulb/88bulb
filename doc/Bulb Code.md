# BulbCode

BulbCode是音箱网关使用的独立协议，用于控制灯的效果；不要和BulbBoot或BulbCast混淆。

| Protocol | 用途                                                     | magic    | 命令                                                         |
| -------- | -------------------------------------------------------- | -------- | ------------------------------------------------------------ |
| BulbBoot | 音箱网关用于控制基础固件（第一级）的指令                 | b01bb007 | blink, boot                                                  |
| BulbCode | 音箱网关用于控制功能固件（第二级）的指令                 | b01bc0de | 16bit encoded command                                        |
| BulbCast | 灯泡的广播，目前第一级有详细定义和实现，第二级需逐步完善 | b01bca57 | device info, aged time, temperature, illumination, lastwill etc. |



## 格式

和BulbBoot一样，BulbCode实际上是使用ble advertisement packet中manufacturer data的最大26字节payload的数据发送。开发者只关心这26个字节即可，使用hex code格式加`\n`结尾发送给thin modem即可。

| magic (4 bytes) | seq (1 byte) | group id (4 bytes) | bit mask (2-4 bytes) | command (2 bytes) | payload (11-13 bytes)      |
| --------------- | ------------ | ------------------ | -------------------- | ----------------- | -------------------------- |
| b0 1b c0 de     | 00-0f        | a0 a1 a2 a3        | ff ff (ff ff)        | 0001              | 00000000000000000000000000 |

说明：

1. 包长永远是26字节；蓝牙数据包有整包校验，无需额外添加校验。
2. seq (sequence number)不用于事物或维护顺序，但需要一直变化，不然如果连续的两个命令的payload完全相同，第二个命令可能被接收者的底层过滤掉；
3. 与bulbboot命令不同，bulbcode的seq的最高4个bit为保留bit，未来可能用于变更bit mask长度；所以seq目前实际上在`00-0f`的取值范围内；也基于此，payload可能**仅有11字节**的可用空间；
4. group id和bulbboot命令一致，是组id；bulbcode实际上是纯组播（multicast）协议，仅有组播功能，无单播（unicast）功能；
5. bit mask掩码覆盖的设备都应该执行此包的命令；
   1. 例如：网关在boot阶段依次向两个不同设备发送了bulbboot指令，`boot_params`分别为`b0b1b2b30201`和`b0b1b2b30204`，则这两个设备均属于`b0b1b2b3`组，掩码分别为`0002`和`0010`，如果一个bulbcode指令的group id + bit mask为`b0b1b2b30012`，则这两个设备都应该执行该命令；
   2. 如果设计就是几个灯在一个场景里的动作永远一致，它们可以使用同一个掩码；例如摆放在角落外围的气氛灯可以有一样的指令，而且，如果command约定的行为具有随机性，即使使用同样掩码仍可获得随机不同效果；
6. command和payload用于表述命令；但日常里人直觉理解的一些灯光效果，例如pulse（脉冲闪烁），square wave（方波），没有很好的自然操作隐喻，只能被理解为一些极限情况，例如正弦波的波幅无穷大以至于饱和，斩波后成为方波。



## 交互

TBD



## 码表

以下编码中如果整数类型超过1字节长度，均使用Most Significant Byte在前面的字节序。例如`(uint16_t)255`是`00 ff`，不是`ff 00`。



### 0001 not implemented yet

| code | option bits (1 bytes) | -    | -    | -    |
| ---- | --------------------- | ---- | ---- | ---- |
| 0001 | 00                    |      |      |      |



### 0002 base color fade in

| code (2 bytes) | option bits (1 bytes) | RGB (3 bytes)      | Fade in Duration (2 bytes, MSB) | Reserved (3-5 bytes) |
| -------------- | --------------------- | ------------------ | ------------------------------- | -------------------- |
| 0002           | 00                    | rrggbb (or hhssvv) | 0000                            | 000000(0000)         |

| option bits | bit mask | 含义                                                         |
| ----------- | -------- | ------------------------------------------------------------ |
| 0000 0001b  | (1 << 0) | 如果设置，duration以秒为单位，如果未设置，duration以100毫秒为单位。 |
| 0000 0010b  | (1 << 1) | 如果设置，在HSV空间逆时针旋转；顺时针指的是红橙黄绿蓝紫红的循环，逆时针则反向。 |
| 1000 0000b  | (1 << 7) | 如果设置，使用HSV；注意！hsv均为0-255，而不是0-360, 0-100, 0-100；请预先做好线性变换。 |
| 0111 1100b  | -        | reserved，请设置为0。                                        |

基础颜色（base color）可以理解为在photoshop类的像素软件里的background层；它只有一个且是最底层，这意味着其它操作或层是在色彩或亮度上修改这一层；同时基础颜色层只有一个，新命令替换旧的base color，而不是叠加。

此命令仅仅指定了基础颜色，未指定其变化。

`Fade in Duration`可以为0，直接设置颜色没有fade in过程。

使用rgb模式或者hsv模式均可设置三色全部关闭。



### 0003 base color hue swing (尚未完成)

| code (2 bytes) | option bits (1 byte) | h amplitude (1 byte) | v amplitude (1 byte) | period in second (1 byte) |
| -------------- | -------------------- | -------------------- | -------------------- | ------------------------- |
| 0003           | 00                   | 00                   | 00                   | 00                        |













