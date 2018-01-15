import * as ts from "typescript";
import { ApiItem } from "../abstractions/api-item";

import { ApiHelpers } from "../api-helpers";

import { ApiMappedDto } from "../contracts/definitions/api-mapped-dto";
import { ApiItemKinds } from "../contracts/api-item-kinds";
import { ApiMetadataDto } from "../contracts/api-metadata-dto";
import { ApiItemLocationDto } from "../contracts/api-item-location-dto";
import { ApiType } from "../contracts/api-type";
import { TSHelpers } from "../ts-helpers";
import { ApiTypeHelpers } from "../api-type-helpers";

export class ApiMapped extends ApiItem<ts.MappedTypeNode, ApiMappedDto> {
    private typeParameter: string | undefined;
    private type: ApiType;
    private isReadonly: boolean;
    private isOptional: boolean;

    protected OnGatherData(): void {
        // TypeParameter
        const typeParameterSymbol = TSHelpers.GetSymbolFromDeclaration(this.Declaration.typeParameter, this.TypeChecker);
        if (typeParameterSymbol != null) {
            this.typeParameter = ApiHelpers.GetItemId(this.Declaration.typeParameter, typeParameterSymbol, this.Options);
        }

        /**
         * Type
         * getTypeFromTypeNode method handles undefined and returns `any` type.
         */
        const type = this.TypeChecker.getTypeFromTypeNode(this.Declaration.type!);
        this.type = ApiTypeHelpers.ResolveApiType(this.Options, type, this.Declaration.type);

        // Readonly
        this.isReadonly = Boolean(this.Declaration.readonlyToken);

        // Optional
        this.isOptional = Boolean(this.Declaration.questionToken);
    }

    public OnExtract(): ApiMappedDto {
        const metadata: ApiMetadataDto = this.GetItemMetadata();
        const location: ApiItemLocationDto = ApiHelpers.GetApiItemLocationDtoFromNode(this.Declaration, this.Options);

        return {
            ApiKind: ApiItemKinds.Mapped,
            Name: this.Symbol.name,
            Metadata: metadata,
            Location: location,
            TypeParameter: this.typeParameter,
            IsOptional: this.isOptional,
            IsReadonly: this.isReadonly,
            Type: this.type,
            _ts: this.GetTsDebugInfo()
        };
    }
}