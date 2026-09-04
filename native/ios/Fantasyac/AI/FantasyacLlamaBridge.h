#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN
@interface FantasyacLlamaBridge : NSObject
- (nullable instancetype)initWithModelPath:(NSString *)path contextSize:(int)contextSize error:(NSError **)error;
- (nullable NSString *)generateRequestJSON:(NSString *)requestJSON maxTokens:(int)maxTokens temperature:(float)temperature topP:(float)topP error:(NSError **)error;
- (void)cancel;
@end
NS_ASSUME_NONNULL_END
