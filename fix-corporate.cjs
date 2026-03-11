const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'client/src/pages/steps/CorporateBasicInfo.tsx');
let content = fs.readFileSync(file, 'utf8');

// Replace Facsimile No. label
content = content.replace('傳真號碼 / Facsimile No.', '傳真號碼 / Fax No.');

// Update formData to include emailVerificationCode
content = content.replace(
  'contactEmail: "",\n  });',
  'contactEmail: "",\n    emailVerificationCode: "",\n  });\n  const [isEmailVerified, setIsEmailVerified] = useState(false);\n  const [isSendingCode, setIsSendingCode] = useState(false);'
);

// Add validateForm logic
const validationLogic = `
    const newErrors: Record<string, string> = {};
    if (!formData.companyEnglishName.trim()) {
      newErrors.companyEnglishName = "請輸入公司英文名稱";
    } else if (!/^[A-Za-z\\s]+$/.test(formData.companyEnglishName)) {
      newErrors.companyEnglishName = "公司英文名稱只能包含英文字母和空格，不能包含特殊符號";
    }

    if (formData.companyChineseName.trim() && !/^[\\u4e00-\\u9fa5]+$/.test(formData.companyChineseName)) {
      newErrors.companyChineseName = "公司中文名稱只能包含中文字，不能包含特殊字符";
    }

    if (!formData.natureOfEntity.trim()) newErrors.natureOfEntity = "請選擇公司性質";
    if (!formData.natureOfBusiness.trim()) newErrors.natureOfBusiness = "請選擇業務性質";
    if (!formData.countryOfIncorporation) newErrors.countryOfIncorporation = "請選擇註冊國家";
    if (!formData.dateOfIncorporation) newErrors.dateOfIncorporation = "請選擇註冊日期";

    if (!formData.certificateOfIncorporationNo.trim()) {
      newErrors.certificateOfIncorporationNo = "請輸入公司註冊證書號碼";
    } else if (!/^\\d+$/.test(formData.certificateOfIncorporationNo)) {
      newErrors.certificateOfIncorporationNo = "格式錯誤，只能採用阿拉伯數字";
    }

    if (formData.businessRegistrationNo.trim() && !/^\\d{8}$/.test(formData.businessRegistrationNo)) {
      newErrors.businessRegistrationNo = "格式錯誤，必須為8位阿拉伯數字";
    }

    if (!formData.registeredAddress.trim()) newErrors.registeredAddress = "請輸入註冊地址";
    if (!formData.businessAddress.trim()) newErrors.businessAddress = "請輸入營業地址";

    const validatePhone = (code: string, phone: string, field: string) => {
      if (!phone.trim()) {
        newErrors[field] = "請輸入電話號碼";
      } else if (!/^\\d+$/.test(phone)) {
        newErrors[field] = "只能輸入阿拉伯數字";
      } else if (code === "+852" && phone.length !== 8) {
        newErrors[field] = "香港電話號碼必須為8位數字";
      } else if (code === "+86" && phone.length !== 11) {
        newErrors[field] = "中國內地電話號碼必須為11位數字";
      }
    };

    validatePhone(formData.officeCountryCode, formData.officeNo, 'officeNo');

    if (formData.facsimileNo.trim() && !/^[0-9+\\s\\-]+$/.test(formData.facsimileNo)) {
      newErrors.facsimileNo = "格式錯誤，只能包含數字、+、空格或-";
    }

    if (!formData.contactName.trim()) newErrors.contactName = "請輸入聯絡人姓名";
    if (!formData.contactTitle.trim()) newErrors.contactTitle = "請輸入職銜";

    validatePhone(formData.contactCountryCode, formData.contactPhone, 'contactPhone');

    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = "請輸入電郵地址";
    } else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = "電郵格式不正確";
    }

    if (formData.contactEmail.trim() && !isEmailVerified) {
      newErrors.emailVerificationCode = "請驗證電郵地址";
    }
`;

content = content.replace(
  /const validateForm = \(\) => \{[\s\S]*?setErrors\(newErrors\);/m,
  `const validateForm = () => {${validationLogic}\n    setErrors(newErrors);`
);

// Add sendCode handler
const sendCodeHandler = `
  const handleSendCode = async () => {
    if (!formData.contactEmail || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(formData.contactEmail)) {
      toast.error("請先輸入有效的電郵地址");
      return;
    }
    setIsSendingCode(true);
    // Mock sending code
    setTimeout(() => {
      setIsSendingCode(false);
      toast.success("驗證碼已發送，請查收 (模擬: 輸入任意4位以上數字)");
    }, 1500);
  };
`;

content = content.replace('const handleNext = () => {', sendCodeHandler + '\n  const handleNext = () => {');

// Update UI for email
const emailUI = `
            <div className="space-y-2">
              <Label htmlFor="contactEmail">電郵地址 / E-mail <span className="text-destructive">*</span></Label>
              <div className="flex gap-2">
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => {
                    setFormData({ ...formData, contactEmail: e.target.value });
                    setIsEmailVerified(false);
                  }}
                  className={errors.contactEmail ? "border-destructive flex-1" : "flex-1"}
                />
                <button 
                  type="button" 
                  onClick={handleSendCode}
                  disabled={isSendingCode || isEmailVerified}
                  className="px-3 py-2 bg-secondary text-secondary-foreground rounded-md text-sm whitespace-nowrap border"
                >
                  {isSendingCode ? "發送中..." : isEmailVerified ? "已驗證" : "發送驗證碼"}
                </button>
              </div>
              {errors.contactEmail && <p className="text-sm text-destructive">{errors.contactEmail}</p>}
            </div>
            
            {!isEmailVerified && (
              <div className="space-y-2">
                <Label htmlFor="emailVerificationCode">郵箱驗證碼 / Verification Code <span className="text-destructive">*</span></Label>
                <div className="flex gap-2">
                  <Input
                    id="emailVerificationCode"
                    value={formData.emailVerificationCode}
                    onChange={(e) => setFormData({ ...formData, emailVerificationCode: e.target.value })}
                    placeholder="請輸入驗證碼"
                    className={errors.emailVerificationCode ? "border-destructive flex-1" : "flex-1"}
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      if (formData.emailVerificationCode.length >= 4) {
                        setIsEmailVerified(true);
                        toast.success("驗證成功");
                        setErrors(prev => { const { emailVerificationCode, ...rest } = prev; return rest; });
                      } else {
                        toast.error("驗證碼錯誤");
                      }
                    }}
                    className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm whitespace-nowrap"
                  >
                    驗證
                  </button>
                </div>
                {errors.emailVerificationCode && <p className="text-sm text-destructive">{errors.emailVerificationCode}</p>}
              </div>
            )}
`;

content = content.replace(
  /<div className="space-y-2">\s*<Label htmlFor="contactEmail">[\s\S]*?<\/div>\s*<\/div>/m,
  emailUI + '\n          </div>'
);

fs.writeFileSync(file, content);
console.log('Updated CorporateBasicInfo.tsx');

const homeFile = path.join(__dirname, 'client/src/pages/Home.tsx');
let homeContent = fs.readFileSync(homeFile, 'utf8');
homeContent = homeContent.replace('v1.0.260310.006', 'v1.0.260310.007');
fs.writeFileSync(homeFile, homeContent);
console.log('Updated Home.tsx');