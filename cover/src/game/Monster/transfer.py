import cv2
import numpy as np

# 读取图片并转换为 RGBA 格式
image = cv2.imread("pic1.jpg", cv2.IMREAD_UNCHANGED)

# 确保图片是 4 通道（如果是 3 通道则添加 alpha ）
if image.shape[2] == 3:
    image = cv2.cvtColor(image, cv2.COLOR_BGR2BGRA)

# 设定黑色背景的范围
lower_black = np.array([0, 0, 0, 0], dtype=np.uint8)  # 纯黑色
upper_black = np.array([2, 2, 2, 255], dtype=np.uint8)  # 允许一点误差，去除接近黑色的背景

# 创建掩码
mask = cv2.inRange(image, lower_black, upper_black)

# 让背景透明（将 mask 覆盖到 alpha 通道）
image[:, :, 3] = 255 - mask

# 保存结果
cv2.imwrite("output.png", image)

print("处理完成，已保存为 output.png")
