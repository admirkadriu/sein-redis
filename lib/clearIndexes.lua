local keys = redis.call("smembers", KEYS[1]);

local remRes

for i, key in ipairs(keys) do
  local keyType = redis.call("type", key)["ok"]

  if keyType == "set" then
    remRes = redis.call("srem", key, KEYS[2])
  else
    remRes = redis.call("del", key)
  end
end

remRes = redis.call("del", KEYS[1])

return remRes
